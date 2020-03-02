import { DatePicker, Text, View } from 'native-base';
import React from 'react';
import I18nManager from '../../../../../I18n/I18nManager';
import FilterControlComponent, { FilterControlComponentProps } from '../FilterControlComponent';
import computeStyleSheet from '../FilterControlComponentStyles';

export interface Props extends FilterControlComponentProps<Date> {
  defaultDate?: Date;
  minimumDate?: Date;
  maximumDate?: Date;
}

interface State {
}

export default class DateFilterControlComponent extends FilterControlComponent<Date> {
  public state: State;
  public props: Props;
  public static defaultProps = {
    defaultDate: new Date()
  };

  constructor(props: Props) {
    super(props);
    this.state = {
    };
  }

  public setState = (state: State | ((prevState: Readonly<State>, props: Readonly<Props>) => State | Pick<State, never>) | Pick<State, never>, callback?: () => void) => {
    super.setState(state, callback);
  }

  public render = () => {
    const style = computeStyleSheet();
    const { label, defaultDate, minimumDate, maximumDate, locale } = this.props;
    let currentDate = defaultDate;
    // Override if already defined
    if (this.getFilterContainerComponent()) {
      currentDate = new Date(this.getValue());
    }
    return (
      <View style={style.rowFilter}>
        <Text style={style.textFilter}>{label}</Text>
        <DatePicker
          defaultDate={currentDate}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          locale={locale}
          timeZoneOffsetInMinutes={undefined}
          modalTransparent={false}
          animationType={'fade'}
          androidMode={'spinner'}
          textStyle={style.filterValue}
          placeHolderTextStyle={style.filterValue}
          onDateChange={(newDate: Date) => this.getFilterContainerComponent().setFilter(this.getID(), newDate)}
          disabled={false}
          formatChosenDate={(date) => I18nManager.formatDateTime(date, 'LL')}
        />
      </View>
    );
  }
}