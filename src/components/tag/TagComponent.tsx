import I18n from 'i18n-js';
import { Card, CardItem, Icon } from 'native-base';
import React from 'react';
import { Text, View } from 'react-native';

import BaseProps from '../../types/BaseProps';
import Tag from '../../types/Tag';
import Utils from '../../utils/Utils';
import Chip from '../chip/Chip';
import computeChipStyleSheet from '../chip/ChipStyle';
import computeStyleSheet from './TagComponentStyle';

interface State {}

export interface Props extends BaseProps {
  tag: Tag;
  selected?: boolean;
  isAdmin?: boolean;
}

export default class TagComponent extends React.Component<Props, State> {
  public state: State;
  public props: Props;

  // eslint-disable-next-line no-useless-constructor
  public constructor(props: Props) {
    super(props);
  }

  public setState = (
    state: State | ((prevState: Readonly<State>, props: Readonly<Props>) => State | Pick<State, never>) | Pick<State, never>,
    callback?: () => void
  ) => {
    super.setState(state, callback);
  };

  public render() {
    const style = computeStyleSheet();
    const chipStyle = computeChipStyleSheet();
    const { tag, isAdmin, selected, navigation } = this.props;
    const userFullName = Utils.buildUserName(tag?.user);
    const statusStyle = tag?.active ? chipStyle.success : chipStyle.danger;
    return (
      <Card style={[style.container, selected ? style.selected : null]}>
        <CardItem style={[style.tagContent]}>
          <View style={style.leftContainer}>
            <View style={style.iconContainer}>
              <Icon style={style.icon} type={'FontAwesome'} name={'plug'}></Icon>
            </View>
            {tag.default && (
              <View style={style.defaultContainer}>
                <Text style={style.badgeText}>{I18n.t('general.default')}</Text>
              </View>
            )}
          </View>
          <View style={style.middleContainer}>
            <View style={style.tagDescriptionContainer}>
              <Text numberOfLines={1} ellipsizeMode={'tail'} style={[style.text, style.tagDescription]}>
                {tag?.description}
              </Text>
            </View>
            {isAdmin && tag.user && (
              <View style={style.userContainer}>
                <Text numberOfLines={1} ellipsizeMode={'tail'} style={[style.text, style.fullName]}>
                  {userFullName}
                </Text>
              </View>
            )}
            <View style={style.tagVisualIDContainer}>
              <Text numberOfLines={1} ellipsizeMode={'tail'} style={[style.text, style.tagVisualID]}>
                {I18n.t('tags.visualID')}: {tag?.visualID}
              </Text>
            </View>
          </View>
          <View style={style.rightContainer}>
            <View style={style.statusContainer}>
              <Chip statusStyle={statusStyle} text={I18n.t(tag?.active ? 'tags.active' : 'tags.inactive')} navigation={navigation} />
            </View>
          </View>
        </CardItem>
      </Card>
    );
  }
}
