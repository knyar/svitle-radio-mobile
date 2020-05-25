import { GeneralApiProblem } from "./api-problem"
import { StreamInfo } from "../../models/stream-info"

export type GetPreferencesResult = { kind: "ok"; preferences: any} | GeneralApiProblem
export type GetStreamInfoResult = { kind: "ok"; streams: Map<string, StreamInfo> } | GeneralApiProblem
