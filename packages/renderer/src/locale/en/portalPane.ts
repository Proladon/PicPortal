export default {
  title: 'Portals',
  mode: {
    label: 'Mode',
    append: 'Append',
    override: 'Override',
  },
  notify: {
    modeChange: 'Docking mode change',
  },
  search: {
    placeholder: 'Search Portal',
  },
  controls: {
    clear: 'Clear',
    active: '{count} active',
    newGroup: 'New group',
    moveLeft: 'Move to left',
    moveRight: 'Move to right',
  },
  empty: {
    title: 'No portal groups',
    description: 'Create a group and add destination folders to start sorting.',
    noMatch: 'No matching portal',
    group: 'This group has no portals yet',
  },
  portalTag: {
    openFolder: 'Open folder',
    actions: 'Portal options',
  },
  portalGroup: {
    addPortal: 'Add portal',
    actions: 'Group options',
    view: {
      label: 'Layout',
      list: 'List View',
      grid: 'Grid View',
    },
    randomColor: 'Random Color',
    syncColor: 'Sync Color',
    rename: 'Rename',
    deleteTitle: 'Delete group',
    deleteContent: 'Delete group "{name}" and all of its portals?',
  },
  portalGroupModal: {
    title: {
      create: 'Create Portal Group',
      edit: 'Edit Portal Group',
    },
    name: 'Group name',
    placeholder: {
      name: 'Input group name',
    },
  },
  portalModal: {
    title: {
      create: 'Create Portal',
      edit: 'Edit Portal',
    },
    mode: {
      manual: 'Manual',
      drop: 'DragDrop',
    },
    fields: {
      name: 'Name',
      link: 'Destination folder',
      bg: 'Background',
      fg: 'Text color',
      preview: 'Preview',
    },
    placeholder: {
      name: 'Input name',
      link: 'Input path',
    },
    dropHint: 'Drop folders here',
    dropCount: '{count} folders added',
  },
  commander: {
    title: 'Activate portal',
    placeholder: 'Search portals…',
    empty: 'No portal found',
  },
}
