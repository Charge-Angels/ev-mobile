import { Card, CardItem, Text, View } from 'native-base';
import React from 'react';
import { ViewStyle } from 'react-native';

import BaseProps from '../../types/BaseProps';
import User, { UserStatus } from '../../types/User';
import Utils from '../../utils/Utils';
import Chip from '../chip/Chip';
import computeChipStyleSheet from '../chip/ChipStyle';
import UserAvatar from './avatar/UserAvatar';
import computeStyleSheet from './UserComponentStyle';

export interface Props extends BaseProps {
  user: User;
  selected?: boolean;
}

interface State {}

export default class UserComponent extends React.Component<Props, State> {
  public props: Props;
  public state: State;

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
    const { user, navigation, selected } = this.props;
    const userFullName = Utils.buildUserName(user);
    const userRole = user ? user.role : '';
    const userStatus = user ? user.status : '';
    const statusStyle = this.computeStatusStyle(userStatus, chipStyle);
    return (
      <Card style={[style.container]}>
        <CardItem style={[style.userContent, selected ? style.selected : style.unselected]}>
          <View style={[this.buildStatusIndicatorStyle(user.status, style), style.statusIndicator]} />
          <View style={style.avatarContainer}>
            {selected ? <UserAvatar icon={'check'} navigation={navigation} /> : <UserAvatar user={user} navigation={navigation} />}
          </View>
          <View style={style.userContainer}>
            <View style={style.userFullnameStatusContainer}>
              <View style={style.fullNameContainer}>
                <Text numberOfLines={1} ellipsizeMode={'tail'} style={style.fullName}>
                  {userFullName}
                </Text>
              </View>
              <Chip statusStyle={statusStyle} text={Utils.translateUserStatus(userStatus)} navigation={navigation} />
            </View>
            <View style={style.emailRoleContainer}>
              <Text numberOfLines={1} ellipsizeMode={'tail'} style={style.email}>
                {user.email}
              </Text>
              <Text numberOfLines={1} ellipsizeMode={'tail'} style={style.role}>
                {Utils.translateUserRole(userRole)}
              </Text>
            </View>
          </View>
        </CardItem>
      </Card>
    );
  }

  private buildStatusIndicatorStyle(userStatus: UserStatus, style: any): ViewStyle {
    switch (userStatus) {
      case UserStatus.ACTIVE:
        return style.statusActive;
      case UserStatus.BLOCKED:
      case UserStatus.INACTIVE:
      case UserStatus.LOCKED:
      case UserStatus.PENDING:
        return style.statusInactive;
    }
  }

  private computeStatusStyle(status: string, style: any) {
    switch (status) {
      case UserStatus.ACTIVE:
        return style.success;
      case UserStatus.PENDING:
        return style.warning;
      case UserStatus.BLOCKED:
      case UserStatus.INACTIVE:
      case UserStatus.LOCKED:
        return style.danger;
    }
  }
}
