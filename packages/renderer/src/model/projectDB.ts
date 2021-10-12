const projectDBModel = (dbName: string): ProjectDB => ({
  project: dbName,
  mainFolder: '',
  portals: [],
  dockings: [],
})

export default projectDBModel
