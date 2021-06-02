import { DrawerActions } from '@react-navigation/native';
import { default as I18n } from 'i18n-js';
import { Container, Spinner } from 'native-base';
import React from 'react';
import { View } from 'react-native';

import HeaderComponent from '../../../components/header/HeaderComponent';
import ItemsList, { ItemSelectionMode } from '../../../components/list/ItemsList';
import SimpleSearchComponent from '../../../components/search/simple/SimpleSearchComponent';
import UserComponent from '../../../components/user/UserComponent';
import I18nManager from '../../../I18n/I18nManager';
import { DataResult } from '../../../types/DataResult';
import User from '../../../types/User';
import Constants from '../../../utils/Constants';
import Utils from '../../../utils/Utils';
import SelectableList, { SelectableProps, SelectableState } from '../../base-screen/SelectableList';
import computeStyleSheet from './UsersStyle';

export interface Props extends SelectableProps<User> {}

export interface State extends SelectableState<Users> {
  users?: User[];
  skip?: number;
  limit?: number;
  count?: number;
  refreshing?: boolean;
  loading?: boolean;
  totalUsersCount: number;
}

export default class Users extends SelectableList<User> {
  public static defaultProps = {
    selectionMode: ItemSelectionMode.NONE,
    isModal: false
  };

  public state: State;
  public props: Props;
  private searchText: string;
  private userIDs: string[];
  private title: string;

  public constructor(props: Props) {
    super(props);
    this.userIDs = Utils.getParamFromNavigation(this.props.route, 'userIDs', null) as string[];
    this.title = Utils.getParamFromNavigation(this.props.route, 'title', null) as string;
    this.state = {
      ...super.state,
      users: [],
      skip: 0,
      limit: Constants.PAGING_SIZE,
      count: 0,
      refreshing: false,
      loading: true,
      totalUsersCount: 0,
      selectedItems: []
    };
    this.setRefreshPeriodMillis(Constants.AUTO_REFRESH_LONG_PERIOD_MILLIS);
  }

  public async componentDidMount(): Promise<void> {
    await super.componentDidMount();
  }

  public async getUsers(searchText: string, skip: number, limit: number, onlyCount: boolean = false): Promise<DataResult<User>> {
    try {
      const params = {
        Search: searchText,
        UserID: this.userIDs?.join('|'),
        carName: this.title
      };
      const users = await this.centralServerProvider.getUsers(
        params,
        onlyCount
          ? Constants.ONLY_RECORD_COUNT
          : {
              skip,
              limit
            }
      );
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
          'users.userUnexpectedError',
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
      const allUsers = await this.getUsers(undefined, 0, limit, true);
      const totalUsersCount = allUsers?.count;
      // Set
      this.setState({
        loading: false,
        users: usersResult,
        count: users.count,
        totalUsersCount
      });
    }
  }

  public search = async (searchText: string) => {
    this.searchText = searchText;
    await this.refresh();
  };

  public render(): React.ReactElement {
    const style = computeStyleSheet();
    const { users, count, skip, limit, refreshing, loading } = this.state;
    const { navigation, isModal, selectionMode } = this.props;

    return (
      <Container style={style.container}>
        <HeaderComponent
          title={this.buildHeaderTitle()}
          subTitle={this.buildHeaderSubtitle()}
          navigation={this.props.navigation}
          leftAction={isModal ? null : this.onBack}
          leftActionIcon={isModal ? null : 'navigate-before'}
          displayTenantLogo={false}
          rightAction={
            isModal
              ? null
              : () => {
                navigation.dispatch(DrawerActions.openDrawer());
                return true;
              }
          }
          rightActionIcon={isModal ? null : 'menu'}
        />
        {loading ? (
          <Spinner style={style.spinner} color="grey" />
        ) : (
          <View style={style.content}>
            <SimpleSearchComponent onChange={async (searchText) => this.search(searchText)} navigation={navigation} />
            <ItemsList<User>
              selectionMode={selectionMode}
              onSelect={this.onItemsSelected.bind(this)}
              data={users}
              navigation={navigation}
              count={count}
              limit={limit}
              skip={skip}
              renderItem={(item: User) => <UserComponent user={item} navigation={this.props.navigation} />}
              refreshing={refreshing}
              manualRefresh={isModal ? null : this.manualRefresh}
              onEndReached={this.onEndScroll}
              emptyTitle={I18n.t('users.noUsers')}
            />
          </View>
        )}
      </Container>
    );
  }

  private buildHeaderTitle(): string {
    const { selectionMode } = this.props;
    switch (selectionMode) {
      case ItemSelectionMode.SINGLE:
        return I18n.t('users.selectUser');
      case ItemSelectionMode.MULTI:
        return I18n.t('users.selectUsers');
      default:
        return this.title ?? I18n.t('sidebar.users');
    }
  }

  private buildHeaderSubtitle(): string {
    const { selectionMode } = this.props;
    const { selectedItems, totalUsersCount, count } = this.state;
    switch (selectionMode) {
      case ItemSelectionMode.MULTI:
      case ItemSelectionMode.SINGLE:
        return `${I18nManager.formatNumber(selectedItems.length)}/${I18nManager.formatNumber(totalUsersCount)}`;
      default:
        return count > 0 && `${I18nManager.formatNumber(count)} ${I18n.t('users.users')}`;
    }
  }
}
