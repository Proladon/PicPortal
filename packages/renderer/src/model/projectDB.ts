const projectDBModel = (dbName: string): ProjectDB => ({
  project: dbName,
  mainFolder: '',
  portals: [],
  docking: [],
})

export default projectDBModel
