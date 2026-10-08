export default {
  notify: {
    needPortal: 'Activate at least one portal first',
    dockingsCleared: 'All dockings cleared',
    missingPortal: 'Some linked portals no longer exist. Fix them first.',
  },
  modes: {
    label: 'View mode',
    GridView: 'Grid',
    ListView: 'List',
    VirtualGrid: 'Virtual grid',
    VirtualList: 'Virtual list',
    FocusView: 'Focus',
  },
  toolbar: {
    filter: 'Filter',
    refresh: 'Refresh',
    quickActions: 'Quick actions',
    perPage: 'Items per page',
    imageSize: 'Thumbnail size',
    dockings: '{count} docked',
  },
  warpingBtn: {
    label: 'START !',
    warping: 'WARPING ...',
  },
  wrapConfirm: {
    title: 'Start transfer',
    content: 'Confirm to start moving the docked files?',
  },
  viewerFilter: {
    title: 'Filter images',
    onlyDockings: 'Only dockings',
    portals: 'Portals',
    fileTypes: 'File types',
    reset: 'Clear filters',
    filterPortals: {
      placeholder: 'Filter portals',
      empty: 'No portal found',
    },
    filterFilesTypes: {
      placeholder: 'Filter files types',
    },
  },
  quickActions: {
    clearDockings: {
      label: 'Clear all dockings',
      warning: 'Sure want to clear all dockings ?',
    },
  },
  empty: {
    title: 'No images found',
    description: 'No image in this folder matches the current filters.',
    noFolderTitle: 'No main folder yet',
    noFolderDescription: 'Choose the folder of images you want to sort.',
    chooseFolder: 'Choose folder',
  },
  noProject: {
    title: 'No project open',
    description: 'Open or create a project before sorting images.',
    goProjects: 'Go to projects',
  },
  pagination: {
    summary: 'Page {page} of {total}',
    previous: 'Previous',
    next: 'Next',
    jump: 'Go to',
  },
  focus: {
    previous: 'Previous',
    next: 'Next',
    path: 'Path',
    portals: 'Portals',
    noPortals: 'No portal linked yet',
  },
  item: {
    preview: 'Preview',
    removePortal: 'Remove {name}',
  },
  conflict: {
    title: 'File already exists',
    description: 'A file with the same name exists at the destination.',
    source: 'Source',
    destination: 'Destination',
    sameOperation: 'Apply to all following conflicts',
    rename: 'Rename',
    plusNum: 'Name +(1)',
    delete: 'Delete file',
    override: 'Overwrite',
    skip: 'Skip',
    newFileName: 'New file name',
    invalidFileName:
      'The name cannot be empty, contain special characters, or end with a dot or space',
  },
}
