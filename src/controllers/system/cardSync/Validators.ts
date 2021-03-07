import { MESSAGE_REQUIRED, MESSAGE_IS_INT, MESSAGE_IS_STRING, MESSAGE_IS_NUMERIC, MESSAGE_IS_ARRAY, MESSAGE_IS_ARRAY_OF_STRING, MESSAGE_IS_BOOLEAN } from '../../../constants';
import { assertsIsMainType, assertsIsOc } from '../../../models/card'
import { body } from 'express-validator'

/**
 * FANDOMカード同期のバリデータ
 * 
 * 内部利用なので性善説で考えれば不要かも？
 * あればあったでデバッグに役立ちそうだし損はない（はず）
 */

// カード更新のバリデータ
export const upsertOneValidator = [
    // ページIDの必須・整数チェック
    body('pageid').not().isEmpty().withMessage(MESSAGE_REQUIRED).isInt().withMessage(MESSAGE_IS_INT),
    // カード名の必須・文字列チェック
    body('name').not().isEmpty().withMessage(MESSAGE_REQUIRED).isString().withMessage(MESSAGE_IS_STRING),
    // コストの数値チェック
    body('cost').optional({ nullable: true }).isNumeric().withMessage(MESSAGE_IS_NUMERIC),
    // 確保力の数値チェック
    body('attack').optional({ nullable: true }).isNumeric().withMessage(MESSAGE_IS_NUMERIC),
    // オブジェクトがSTJJのOCかチェック
    body('oc').optional({ nullable: true }).custom(oc => {
        assertsIsOc(oc)
        return true
    }),
    // メインタイプの必須・配列チェック・要素がSTJJのメインタイプかチェック
    body('maintypes').not().isEmpty().withMessage(MESSAGE_REQUIRED).isArray().withMessage(MESSAGE_IS_ARRAY).custom(maintypes => {
        (maintypes as Array<any>).forEach(maintype => assertsIsMainType(maintype))
        return true
    }),
    // サブタイプの配列チェック・要素が文字列かチェック
    body('subtypes').optional({ nullable: true }).isArray().withMessage(MESSAGE_IS_ARRAY).custom(subtypes => {
        (subtypes as Array<any>).forEach(subtype => {
            if (typeof subtype !== 'string') {
                throw Error(MESSAGE_IS_ARRAY_OF_STRING)
            }
        })
        return true
    }),
    // 効果の文字列チェック
    body('effect').optional({ nullable: true }).isString().withMessage(MESSAGE_IS_STRING),
    // タグの配列チェック・要素が文字列かチェック
    body('tags').optional({ nullable: true }).isArray().withMessage(MESSAGE_IS_ARRAY).custom(tags => {
        (tags as Array<any>).forEach(tag => {
            if (typeof tag !== 'string') {
                throw Error(MESSAGE_IS_ARRAY_OF_STRING)
            }
        })
        return true
    }),
    // 永久収容の真理値チェック
    body('banned').optional({ nullable: true }).isBoolean().withMessage(MESSAGE_IS_BOOLEAN),
    // リビジョンの必須・整数チェック
    body('latest_revid').not().isEmpty().withMessage(MESSAGE_REQUIRED).isInt().withMessage(MESSAGE_IS_INT),
];

// カード削除のバリデータ
export const bulkDeleteValidator = [
    // 必須チェック・配列チェック・要素が整数かチェック
    body('deleteTargetCardPageids').not().isEmpty().withMessage(MESSAGE_REQUIRED).custom(ids => {
        (ids as Array<any>).forEach(id => {
            if (!Number.isSafeInteger(id)) {
                throw Error(MESSAGE_IS_INT)
            }
        })
        return true
    })
]