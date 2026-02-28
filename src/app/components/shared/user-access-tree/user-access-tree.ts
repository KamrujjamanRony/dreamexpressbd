import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-access-tree',
  imports: [FormsModule],
  templateUrl: './user-access-tree.html',
  styleUrl: './user-access-tree.css',
})
export class UserAccessTree {
  readonly nodes = input<any[]>([]);

  constructor() { }

  ngOnInit(): void {
    this.initializeCollapseState(this.nodes());
  }

  /** Select all nodes */
  selectAll() {
    this.nodes().forEach(node => {
      node.isSelected = true;
      this.updateChildren(node, true);
    });
    // this.toastService.showMessage('success', 'Successful', 'All Access Selected!');
  }

  /** Deselect all nodes */
  deselectAll() {
    this.nodes().forEach(node => {
      node.isSelected = false;
      this.updateChildren(node, false);
    });
    // this.toastService.showMessage('warn', 'Successful', 'All Access deselected!');
  }

  /** When a menu is checked, select all children and permissions */
  onCheck(node: any, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    node.isSelected = checked;
    this.updateChildren(node, checked);
  }

  /** Select all child nodes and permissions */
  private updateChildren(node: any, checked: boolean) {
    if (node.children) {
      node.children.forEach((child: any) => {
        child.isSelected = checked;
        this.updateChildren(child, checked); // Recursively apply to all children
      });
    }
    if (node.permissionsKey) {
      node.permissionsKey.forEach((permission: any) => {
        permission.isSelected = checked;
      });
    }
  }

  /** When a permission is checked manually */
  onPermissionCheck(node: any) {
    // If at least one permission is checked, keep menu checked
    node.isSelected = node.permissionsKey.some((p: any) => p.isSelected);
  }

  /** Toggle collapsing menus */
  toggleCollapse(node: any) {
    node.collapsed = !node.collapsed;
  }

  /** Initialize collapse state */
  private initializeCollapseState(nodes: any[]) {
    nodes.forEach((node) => {
      if (!('collapsed' in node)) {
        node.collapsed = true; // Default to collapsed
      }
      if (node.children) {
        this.initializeCollapseState(node.children);
      }
    });
  }

}
