interface Docking {
  target: string
  portals: ActivedPortals[]
}

interface ProjectDB {
  project: string
  mainFolder: string
  portals: PortalGroup[]
  dockings: Docking[]
}
// --- new ---
type Project = {
  id: string
  name: string
  path: string
  color: string
}
type MainFolder = {
  name: string
  path: string
}
type Portal = {
  id: string
  name: string
  link: string
  bg: string
  fg: string
}
type PortalGroup = {
  childs: Portal[]
  group: string
  id: string
}
type DBData = {
  project: string
  portals: Portals[]
  dockings: any[]
  mainFolder: MainFolder
}

type ActivePortalRef = {
  id: string
  group: string
}
