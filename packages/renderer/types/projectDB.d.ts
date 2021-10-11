interface Portal {
  name: string
  id: NanoId
  bg: string
  fg: string
  link: string
}

interface PortalGroup {
  group: string
  id: NanoId
  childs: Portal[]
}

interface Docking {
  target: string
  portals: ActivedPortals[]
}

interface ProjectDB {
  project: string
  mainFolder: string
  portals: PortalGroup[]
  docking: Docking[]
}
