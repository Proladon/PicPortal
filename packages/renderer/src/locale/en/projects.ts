export default {
  pageTitle: 'Projects',
  description: 'Pick a project to start sorting images',
  count: '{count} projects',
  openExisting: 'Open project (.db)',
  importElectron: 'Import Electron settings',
  newProject: 'New Project',
  dropHint: 'Drop a .db project file here to open it',
  empty: {
    title: 'No projects yet',
    description: 'Create a new project or open an existing project file.',
  },
  card: {
    edit: 'Edit project',
    delete: 'Delete project',
    current: 'Current',
  },
  notify: {
    notFoundProject: 'Project file no longer exists',
    deleteSuccess: 'Project deleted',
    updateSuccess: 'Project updated',
    createSuccess: 'Project created',
    busy: 'Finish the batch job and resolve conflicts first',
    settingsImported:
      'Settings imported: {count} projects added; existing settings were kept',
  },
  deleteProject: {
    title: 'Delete project',
    content:
      'Remove "{name}" from the list? The project file itself is not deleted.',
  },
  editProject: {
    title: 'Edit Project',
    update: 'Update',
  },
  createProject: {
    title: 'Create New Project',
    description: 'The project file (.db) stores your portals and image links.',
    create: 'Create',
    fields: {
      name: 'Project name',
      path: 'Location',
      color: 'Label color',
    },
    placeholder: {
      projectName: 'Input project name',
      projectPath: 'Select project path',
    },
    validation: {
      name: 'Project name is required',
      path: 'Project path is required',
    },
  },
}
