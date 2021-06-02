import { DrawerActions } from '@react-navigation/native';
import { default as I18n, default as i18n } from 'i18n-js';
import { Container, Spinner } from 'native-base';
import React from 'react';
import { View } from 'react-native';

import HeaderComponent from '../../../components/header/HeaderComponent';
import ItemsList from '../../../components/list/ItemsList';
import SimpleSearchComponent from '../../../components/search/simple/SimpleSearchComponent';
import UserComponent from '../../../components/user/UserComponent';
import I18nManager from '../../../I18n/I18nManager';
import BaseProps from '../../../types/BaseProps';
import { DataResult } from '../../../types/DataResult';
import User from '../../../types/User';
import Constants from '../../../utils/Constants';
import Utils from '../../../utils/Utils';
import BaseAutoRefreshScreen from '../../base-screen/BaseAutoRefreshScreen';
import computeStyleSheet from './UsersStyle';

export interface Props extends BaseProps {}

export interface State {
  users?: User[];
  skip?: number;
  limit?: number;
  count?: number;
  refreshing?: boolean;
  loading?: boolean;
}

export default class Users extends BaseAutoRefreshScreen<Props, State> {
  public state: State;
  public props: Props;
  private searchText: string;
  private userIDs: string[];
  private title: string;

  public constructor(props: Props) {
    super(props);
    this.state = {
      users: [],
      skip: 0,
      limit: Constants.PAGING_SIZE,
      count: 0,
      refreshing: false,
      loading: true
    };
    this.setRefreshPeriodMillis(Constants.AUTO_REFRESH_LONG_PERIOD_MILLIS);
  }

  public async componentDidMount(): Promise<void> {
    this.userIDs = Utils.getParamFromNavigation(this.props.route, 'userIDs', null) as string[];
    this.title = Utils.getParamFromNavigation(this.props.route, 'title', null) as string;
    await super.componentDidMount();
  }

  public async getUsers(searchText: string, skip: number, limit: number): Promise<DataResult<User>> {
    try {
      const params = {
        Search: searchText,
        UserID: this.userIDs?.join('|'),
        carName: this.title
      };
      const users = await this.centralServerProvider.getUsers(params, { skip, limit });
      // Check
      if (users.count === -1) {
        // Request nbr of records
        const usersNbrRecordsOnly = await this.centralServerProvider.getUsers(params, Constants.ONLY_RECORD_COUNT);
        // Set
        users.count = usersNbrRecordsOnly.count;
      }
      return users;
    } catch (error) {
      // Check if HTTP?
      if (!error.request) {
        Utils.handleHttpUnexpectedError(
          this.centralServerProvider,
          error,
          'transactions.transactionUnexpectedError',
          this.props.navigation,
          this.refresh.bind(this)
        );
      }
    }
    return null;
  }

  public onBack = () => {
    // Back mobile button: Force navigation
    this.props.navigation.goBack();
    // Do not bubble up
    return true;
  };

  public onEndScroll = async () => {
    const { count, skip, limit } = this.state;
    // No reached the end?
    if (skip + limit < count || count === -1) {
      // No: get next sites
      const users = await this.getUsers(this.searchText, skip + Constants.PAGING_SIZE, limit);
      // Add sites
      this.setState((prevState) => ({
        users: users ? [...prevState.users, ...users.result] : prevState.users,
        skip: prevState.skip + Constants.PAGING_SIZE,
        refreshing: false
      }));
    }
  };

  public setState = (
    state: State | ((prevState: Readonly<State>, props: Readonly<Props>) => State | Pick<State, never>) | Pick<State, never>,
    callback?: () => void
  ) => {
    super.setState(state, callback);
  };

  public async refresh(): Promise<void> {
    if (this.isMounted()) {
      const { skip, limit } = this.state;
      // Refresh All
      const users = await this.getUsers(this.searchText, 0, skip + limit);
      const usersResult = users ? users.result : [];
      // Set
      this.setState({
        loading: false,
        users: usersResult,
        count: users.count
      });
    }
  }

  public search = async (searchText: string) => {
    this.searchText = searchText;
    await this.refresh();
  };

  public render = () => {
    const style = computeStyleSheet();
    const { users, count, skip, limit, refreshing, loading } = this.state;
    const { navigation } = this.props;
    return (
      <Container style={style.container}>
        <HeaderComponent
          title={this.title ?? i18n.t('sidebar.users')}
          subTitle={count > 0 ? `${I18nManager.formatNumber(count)} ${I18n.t('users.users')}` : null}
          navigation={this.props.navigation}
          leftAction={this.onBack}
          leftActionIcon={'navigate-before'}
          rightAction={() => {
            navigation.dispatch(DrawerActions.openDrawer());
            return true;
          }}
          rightActionIcon={'menu'}
        />
        {loading ? (
          <Spinner style={style.spinner} color="grey" />
        ) : (
          <View style={style.content}>
            <SimpleSearchComponent onChange={async (searchText) => this.search(searchText)} navigation={navigation} />
            <ItemsList<User>
              data={users}
              navigation={navigation}
              count={count}
              limit={limit}
              skip={skip}
              renderItem={(item: User, selected: boolean) => (
                <UserComponent user={item} selected={selected} navigation={this.props.navigation} />
              )}
              refreshing={refreshing}
              manualRefresh={this.manualRefresh}
              onEndReached={this.onEndScroll}
              emptyTitle={i18n.t('users.noUsers')}
            />
          </View>
        )}
      </Container>
    );
  };
}
