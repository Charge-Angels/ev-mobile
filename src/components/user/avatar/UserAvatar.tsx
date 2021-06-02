import { View } from 'native-base';
import React from 'react';
import { Avatar } from 'react-native-elements';

import noPhoto from '../../../../assets/no-photo.png';
import CentralServerProvider from '../../../provider/CentralServerProvider';
import ProviderFactory from '../../../provider/ProviderFactory';
import BaseProps from '../../../types/BaseProps';
import User from '../../../types/User';
import Constants from '../../../utils/Constants';
import Utils from '../../../utils/Utils';
import computeStyleSheet from './UserAvatarStyle';
import { scale } from 'react-native-size-matters';

interface State {
  user?: User;
}

export interface Props extends BaseProps {
  user?: User;
  selected?: boolean;
  size?: number;
}

export default class UserAvatar extends React.Component<Props, State> {
  public static defaultProps = {
    selected: false
  };
  private centralServerProvider: CentralServerProvider;

  public constructor(props: Props) {
    super(props);
    this.state = {
      user: this.props.user
    };
  }

  public async componentDidMount(): Promise<void> {
    this.centralServerProvider = await ProviderFactory.getProvider();
    const { user } = this.props;
    if (user) {
      user.image = await this.getUserImage(user.id as string);
      this.setState({ user });
    }
  }

  public async componentDidUpdate() {
    const { user } = this.props;
    if (user) {
      user.image = await this.getUserImage(user.id as string);
      if (JSON.stringify(this.state.user) !== JSON.stringify(user)) {
        this.setState({ user });
      }
    }
  }

  public setState = (
    state: State | ((prevState: Readonly<State>, props: Readonly<Props>) => State | Pick<State, never>) | Pick<State, never>,
    callback?: () => void
  ) => {
    super.setState(state, callback);
  };

  public render() {
    const { selected, size } = this.props;
    const { user } = this.state;
    const style = computeStyleSheet();
    const userInitials = Utils.buildUserInitials(user);
    const userName = Utils.buildUserName(user);
    const isNameHyphen = userName === Constants.HYPHEN;
    const userImageURI = user ? (isNameHyphen ? noPhoto : user.image) : noPhoto;
    return (
      <View>
        {userImageURI ? (
          <Avatar
            size={size ? scale(size) : style.avatar.fontSize}
            rounded={true}
            source={userImageURI === noPhoto ? noPhoto : { uri: userImageURI }}
            titleStyle={style.avatarTitle}
            overlayContainerStyle={[style.avatarContainer, selected ? style.avatarSelected : null]}>
            {selected && <Avatar.Accessory name={'done'} size={style.accessory.fontSize} color={style.accessory.color} />}
          </Avatar>
        ) : (
          <Avatar
            size={size ? scale(size) : style.avatar.fontSize}
            rounded={true}
            title={userInitials}
            titleStyle={style.avatarTitle}
            overlayContainerStyle={[style.avatarContainer, selected ? style.avatarSelected : null]}>
            {selected && <Avatar.Accessory name={'done'} size={style.accessory.fontSize} color={style.accessory.color} />}
          </Avatar>
        )}
      </View>
    );
  }

  private async getUserImage(id: string) {
    try {
      return await this.centralServerProvider.getUserImage({ ID: id });
    } catch (error) {
      // Check if HTTP?
      if (!error.request) {
        Utils.handleHttpUnexpectedError(this.centralServerProvider, error, 'users.userUnexpectedError', this.props.navigation);
      }
    }
    return null;
  }
}
