import { MESSAGE_IS_OC, MESSAGE_IS_MAINTYPE } from './../constants'

// STJJのメインタイプ
const mainTypes = ['オブジェクト', '人事', 'Tale', 'Incident', 'Canon', 'Hub', '契約'] as const
export type MainType = typeof mainTypes[number]
// STJJのルールで定義されたサブタイプ（使わないかも）
const ruleDefinedSubTypes = ['【効果】', '【コンビ】', '【フィールド】', '【トークン】'] as const
export type RuleDefinedSubType = typeof ruleDefinedSubTypes[number]
// STJJのOC
const objectClasses = ['Safe', 'Euclid', 'Keter', 'Thaumiel', 'Neutralized', 'Unclassed', 'Anomalous', 'Explained'] as const
export type ObjectClass = typeof objectClasses[number]

// カード
export interface Card {
    _id?: string
    pageid: number
    name: string
    cost?: number
    attack?: number
    oc?: ObjectClass
    maintypes: [MainType, ...MainType[]];
    subtypes?: [string, ...string[]];
    effect?: string
    tags?: [string, ...string[]];
    banned?: true
    lastrevid: number
    page_title?: string
}

// OCとして正しいかのassertion
export function assertsIsOc(value: unknown): asserts value is ObjectClass {
    if (!objectClasses.includes(value as any)) {
        throw Error(MESSAGE_IS_OC)
    }
}

// メインタイプとして正しいかのassertion
export function assertsIsMainType(value: unknown): asserts value is MainType {
    if (!mainTypes.includes(value as any)) {
        throw Error(MESSAGE_IS_MAINTYPE)
    }
}