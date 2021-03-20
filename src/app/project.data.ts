/* firestore document */
export interface Messages {
  id?: string;
  messages: MsgDat[];
}

export interface MsgDat {
  msg: string;
  time: string;
  prtlId?: string;
}

export interface CharDat{
  char: string;
  ingressName: string;
  time: string;
}

/* firestore document */
export interface ColumnChar {
  id?: string; // unique identifier _CHAR: then column names A to P...
  final?: CharDat;
  notes?: string;
  rawDataId: string;
  portalCount?: number;
  portalsLength: number;
  percentDone: number;
}

/*
  "uid": "1KYU0BdE0rXTly5Y5KZslOvxpow2",
  "displayName": "Tom Wiegand",
  "photoURL": "https://lh3.googleusercontent.com/a-/AOh14GhUE1ZS-PPJZ3ygHR3bStggNLzwXttyRimxxr4y=s96-c",
  "email": "surrealranchhand@gmail.com",
 */
export interface ProjectUser {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
}

export interface IngressNameData {
  userUid: string;
  name: string;
}

////////////////////////////  Current ///////////////////////////////////
// NOTE all fields are optional since firebase returns unknown TODO more research needed here
export interface BootParam {
  id?: string;
  project_id?: string;
  folder: string;
  portalCollectionName?: string;
  admin_list?: string[];
}

export interface LatLng {
  lat: number;
  lng: number;
}

/* A firestore Document */
export interface PortalRec {
  id?: string;
  index: number;
  colName: string;
  rawDataId: string;
  user: string;
  owner: string;
  l: number;
  t: number;
  r: number;
  b: number;
  status?: number;
  name?: string;
  url?: string;
  latLng?: LatLng;
  msg?: string;
}


export interface Column{
  name: string;
  offset: number;
  width: number;
  portals?: PortalRec[];
}

export interface RawData {
  id: string;
  name: string;
  columns: Column[];
}

// NOTE for constructing rawData for the _metadata document onl 2 fields required
export interface ColumnRecMetaData {
  rawDataId: string;
  id: string;
  rawData: RawData;
}


