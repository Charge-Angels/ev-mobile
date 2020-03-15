import React from 'react';
import SecuredStorage from '../../../../utils/SecuredStorage';
import FilterControlComponent from '../controls/FilterControlComponent';

export interface FilterContainerComponentProps {
  onFilterChanged?: (filters: any, applyFilters: boolean) => void;
  visible?: boolean;
  children?: React.ReactNode;
}

export interface FilterContainerComponentState {
  visible?: boolean;
}

export default abstract class FilterContainerComponent extends React.Component<FilterContainerComponentProps, FilterContainerComponentState> {
  public state: FilterContainerComponentState;
  public props: FilterContainerComponentProps;
  public static defaultProps = {
    visible: false
  };
  private filterControlComponents: FilterControlComponent<any>[] = [];

  constructor(props: FilterContainerComponentProps) {
    super(props);
    this.state = {
      visible: props.visible ? props.visible : false
    };
  }

  public setState = (state: FilterContainerComponentState | ((prevState: Readonly<FilterContainerComponentState>, props: Readonly<FilterContainerComponentProps>) => FilterContainerComponentState | Pick<FilterContainerComponentState, never>) | Pick<FilterContainerComponentState, never>, callback?: () => void) => {
    super.setState(state, callback);
  }

  public setVisible = (visible: boolean) => {
    this.setState({ visible });
  }

  public async notifyFilterChanged() {
    const { onFilterChanged } = this.props;
    // Save
    await this.saveFilters();
    // Notify
    onFilterChanged(this.getFilters(), true);
  }

  public async setFilterControlComponents(filterControlComponents: Array<FilterControlComponent<any>>) {
    this.filterControlComponents = filterControlComponents;
  }

  public setFilter = async (filterID: string, filterValue: any) => {
    // Search
    for (const filterControlComponent of this.filterControlComponents) {
      // Set
      if (filterControlComponent.getID() === filterID) {
        filterControlComponent.setValue(filterValue);
        this.notifyFilterChanged();
        break;
      }
    }
  }

  public clearFilter = async (filterID: string) => {
    // Search
    for (const filterControlComponent of this.filterControlComponents) {
      if (filterControlComponent.getID() === filterID) {
        // Set
        filterControlComponent.clearValue();
        this.notifyFilterChanged();
        break;
      }
    }
  }

  public getFilter = (id: string): any => {
    // Search
    for (const filterControlComponent of this.filterControlComponents) {
      if (filterControlComponent.getID() === id) {
        return filterControlComponent.getValue();
      }
    }
    return null;
  }

  public getFilters = (): any => {
    const filters: any = {};
    // Build
    for (const filterControlComponent of this.filterControlComponents) {
      filters[filterControlComponent.getID()] = filterControlComponent.getValue();
    }
    return filters;
  }

  public async applyFiltersAndNotify() {
    // Save
    await this.saveFilters();
    // Trigger notif
    this.notifyFilterChanged();
  }

  public clearFilters() {
    // Clear
    for (const filterControlComponent of this.filterControlComponents) {
      filterControlComponent.clearValue();
    }
  }

  public getNumberOfFilters(): number {
    let numberOfFilter = 0
    for (const filterControlComponent of this.filterControlComponents) {
      if (filterControlComponent.getValue()) {
        numberOfFilter++;
      }
    }
    return numberOfFilter;
  }

  public async clearFiltersAndNotify() {
    // Clear
    await this.clearFilters();
    // Save
    await this.saveFilters();
    // Trigger notif
    this.notifyFilterChanged();
  }

  public saveFilters = async () => {
    // Build
    for (const filterControlComponent of this.filterControlComponents) {
      // Save
      if (filterControlComponent.canBeSaved()) {
        await SecuredStorage.saveFilterValue(filterControlComponent.getInternalID(), filterControlComponent.getValue());
      }
    }
  }
}
