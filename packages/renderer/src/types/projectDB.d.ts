interface Docking {
  target: string
  portals: NanoId[]
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
  id?: string
  project?: string
  portals: PortalGroup[]
  dockings: Docking[]
  mainFolder: MainFolder | ''
  [key: string]: unknown
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
