interface Docking {
  target: string
  portals: ActivedPortals[]
}

interface ActivedPortals {
  group: NanoId
  id: NanoId
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

type DBData = {
  project: string
  portals: Portals[]
  dockings: any[]
  mainFolder: MainFolder
}

type PortalGroup = {
  childs: Portal[]
  group: string
  id: string
}

type Portal = {
  id: string
  name: string
  link: string
  bg: string
  fg: string
}

type ActivePortalRef = {
  id: string
  group: string
}
