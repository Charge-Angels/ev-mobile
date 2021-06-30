import React from 'react';
import { Avatar } from 'react-native-elements';
import { scale } from 'react-native-size-matters';

import CentralServerProvider from '../../../provider/CentralServerProvider';
import ProviderFactory from '../../../provider/ProviderFactory';
import BaseProps from '../../../types/BaseProps';
import User from '../../../types/User';
import Utils from '../../../utils/Utils';
import computeStyleSheet from './UserAvatarStyle';

interface State {
}

export interface Props extends BaseProps {
  user?: User;
  accessoryIcon?: string;
  size?: number;
  icon?: string;
}

export default class UserAvatar extends React.Component<Props, State> {
  public static defaultProps: { size: number };
  private centralServerProvider: CentralServerProvider;
  private commonColors = Utils.getCurrentCommonColor();
  public constructor(props: Props) {
    super(props);
    this.state = {
      user: this.props.user
    };
  }

  public async componentDidMount(): Promise<void> {
    this.centralServerProvider = await ProviderFactory.getProvider();
  }

  public async componentDidUpdate() {
  }

  public setState = (
    state: State | ((prevState: Readonly<State>, props: Readonly<Props>) => State | Pick<State, never>) | Pick<State, never>,
    callback?: () => void
  ) => {
    super.setState(state, callback);
  };

  public render() {
    const { accessoryIcon, size, icon } = this.props;
    const style = computeStyleSheet();
    // If the icon is provided, we display it instead of the user
    if (icon) {
      const iconSize: number = (scale(size) * 3) / 5;
      return (
        <Avatar
          rounded={true}
          size={scale(size)}
          icon={{ name: icon, size: iconSize, color: this.commonColors.textColor }}
          overlayContainerStyle={[style.titleAvatarContainer, accessoryIcon ? style.avatarWithAccessory : null]}>
          {this.renderAvatarAccessory()}
        </Avatar>
      );
      // When no icon is provided
    } else {
      const { user } = this.props;
      const userInitials = Utils.buildUserInitials(user);
      // const userImageURI = user ? user.image : null;
      const userImageURI = null; // Keep the nbr of requests low (only load visible images)
      // Display the user's photo if available
      if (userImageURI) {
        return (
          <Avatar
            size={scale(size)}
            rounded={true}
            source={{ uri: userImageURI }}
            overlayContainerStyle={[style.avatarContainer, accessoryIcon ? style.avatarWithAccessory : null]}>
            {this.renderAvatarAccessory()}
          </Avatar>
        );
      }
      // Display the user's initials
      return (
        <Avatar
          rounded={true}
          size={scale(size)}
          title={userInitials}
          titleStyle={style.avatarTitle}
          overlayContainerStyle={[style.titleAvatarContainer, accessoryIcon ? style.avatarWithAccessory : null]}>
          {this.renderAvatarAccessory()}
        </Avatar>
      );
    }
  }

  private renderAvatarAccessory() {
    const { accessoryIcon, size } = this.props;
    const accessorySize: number = (scale(size) * 3) / 5;
    return accessoryIcon && <Avatar.Accessory name={accessoryIcon} size={accessorySize} color={this.commonColors.textColor} />;
  }

  private async getUserImage(id: string) {
    try {
      return await this.centralServerProvider?.getUserImage({ ID: id });
    } catch (error) {
      // Check if HTTP?
      if (!error.request) {
        await Utils.handleHttpUnexpectedError(this.centralServerProvider, error, 'users.userUnexpectedError', this.props.navigation);
      }
    }
    return null;
  }
}
UserAvatar.defaultProps = {
  size: 50
};
