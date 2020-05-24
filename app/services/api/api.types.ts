import { GeneralApiProblem } from "./api-problem"
import { StationSnapshot } from "../../models/station"

export type GetPreferencesResult = { kind: "ok"; preferences: any} | GeneralApiProblem
export type GetStationsResult = { kind: "ok"; stations: Map<string, StationSnapshot> } | GeneralApiProblem
