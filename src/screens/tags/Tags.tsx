import { DrawerActions } from '@react-navigation/native';
import i18n from 'i18n-js';
import { Container, Spinner } from 'native-base';
import React from 'react';
import { View } from 'react-native';

import HeaderComponent from '../../components/header/HeaderComponent';
import ItemsList, { ItemsSeparatorType } from '../../components/list/ItemsList';
import SimpleSearchComponent from '../../components/search/simple/SimpleSearchComponent';
import TagComponent from '../../components/tag/TagComponent';
import I18nManager from '../../I18n/I18nManager';
import BaseScreen from '../../screens/base-screen/BaseScreen';
import BaseProps from '../../types/BaseProps';
import { DataResult } from '../../types/DataResult';
import { HTTPAuthError } from '../../types/HTTPError';
import Tag from '../../types/Tag';
import Constants from '../../utils/Constants';
import Utils from '../../utils/Utils';
import computeStyleSheet from '../transactions/TransactionsStyles';

export interface Props extends BaseProps {}

interface State {
  tags?: Tag[];
  skip?: number;
  limit?: number;
  count?: number;
  refreshing?: boolean;
  loading?: boolean;
}

export default class Tags extends BaseScreen<Props, State> {
  public state: State;
  public props: Props;
  private searchText: string;

  public constructor(props: Props) {
    super(props);
    this.state = {
      tags: [],
      skip: 0,
      limit: Constants.PAGING_SIZE,
      count: 0,
      refreshing: false,
      loading: true
    };
  }

  public async componentDidMount(): Promise<void> {
    await super.componentDidMount();
    await this.refresh();
  }

  public setState = (
    state: State | ((prevState: Readonly<State>, props: Readonly<Props>) => State | Pick<State, never>) | Pick<State, never>,
    callback?: () => void
  ) => {
    super.setState(state, callback);
  };

  public async getTags(searchText: string, skip: number, limit: number): Promise<DataResult<Tag>> {
    try {
      const params = {
        Search: searchText,
        WithUser: true
      };
      // Get the Tags
      const tags = await this.centralServerProvider.getTags(params, { skip, limit }, ['-createdOn']);
      // Get total number of records
      if ((tags.count === -1) && Utils.isEmptyArray(this.state.tags)) {
        const tagsNbrRecordsOnly = await this.centralServerProvider.getTags(params, Constants.ONLY_RECORD_COUNT);
        tags.count = tagsNbrRecordsOnly.count;
      }
      return tags;
    } catch (error) {
      // Check if HTTP?
      if (!error.request || error.request.status !== HTTPAuthError.FORBIDDEN) {
        await Utils.handleHttpUnexpectedError(
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
    this.props.navigation.navigate('HomeNavigator');
    // Do not bubble up
    return true;
  };

  public onEndScroll = async () => {
    const { count, skip, limit } = this.state;
    // No reached the end?
    if (skip + limit < count || count === -1) {
      // No: get next sites
      const tags = await this.getTags(this.searchText, skip + Constants.PAGING_SIZE, limit);
      // Add sites
      this.setState((prevState) => ({
        tags: tags ? [...prevState.tags, ...tags.result] : prevState.tags,
        skip: prevState.skip + Constants.PAGING_SIZE,
        refreshing: false
      }));
    }
  };

  public async refresh(): Promise<void> {
    if (this.isMounted()) {
      const { skip, limit } = this.state;
      // Refresh All
      const tags = await this.getTags(this.searchText, 0, skip + limit);
      // Set
      this.setState({
        loading: false,
        tags: tags ? tags.result : [],
        count: tags ? tags.count : 0
      });
    }
  }

  public search = async (searchText: string) => {
    this.searchText = searchText;
    await this.refresh();
  };

  public render = () => {
    const style = computeStyleSheet();
    const { tags, count, skip, limit, refreshing, loading } = this.state;
    const { navigation } = this.props;
    return (
      <Container style={style.container}>
        <HeaderComponent
          title={i18n.t('sidebar.badges')}
          subTitle={count > 0 ? `${I18nManager.formatNumber(count)} ${i18n.t('tags.tags')}` : null}
          navigation={this.props.navigation}
          leftAction={this.onBack}
          leftActionIcon={'navigate-before'}
          rightAction={() => {
            navigation.dispatch(DrawerActions.openDrawer());
            return true;
          }}
          rightActionIcon={'menu'}
        />
        <View style={style.searchBar}>
          <SimpleSearchComponent onChange={async (searchText) => this.search(searchText)} navigation={navigation} />
        </View>
        {loading ? (
          <Spinner style={style.spinner} color="grey" />
        ) : (
          <View style={style.content}>
            <ItemsList<Tag>
              data={tags}
              navigation={navigation}
              count={count}
              limit={limit}
              skip={skip}
              renderItem={(item: Tag, selected: boolean) => (
                <TagComponent tag={item} isAdmin={this.securityProvider?.isAdmin()} selected={selected} navigation={navigation} />
              )}
              refreshing={refreshing}
              manualRefresh={this.manualRefresh}
              onEndReached={this.onEndScroll}
              emptyTitle={i18n.t('tags.noTags')}
            />
          </View>
        )}
      </Container>
    );
  };
}
