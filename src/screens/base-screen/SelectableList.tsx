import React from 'react';
import BaseProps from '../../types/BaseProps';
import ItemsList, { ItemSelectionMode } from '../../components/list/ItemsList';
import ListItem from '../../types/ListItem';
import BaseScreen from './BaseScreen';

export interface SelectableProps<T> extends BaseProps {
  selectionMode?: ItemSelectionMode;
  isModal?: boolean;
  onItemsSelected?: (selectedItems: T[]) => void;
}

export interface SelectableState<T> {
  selectedItems: T[];
}

export default class SelectableList<T extends ListItem> extends BaseScreen<SelectableProps<T>, SelectableState<T>> {
  public static defaultProps = {
    selectionMode: ItemSelectionMode.NONE,
    isModal: false
  };
  public state: SelectableState<T>;
  public props: SelectableProps<T>;
  protected itemsListRef = React.createRef<ItemsList<T>>();

  public clearSelectedItems(): void {
    this.itemsListRef.current?.clearSelectedItems();
  }

  protected onItemsSelected(selectedItems: T[]): void {
    this.setState({ selectedItems });
    const { onItemsSelected } = this.props;
    if (onItemsSelected) {
      onItemsSelected(selectedItems);
    }
  }
}
