import { Router, Request, Response } from 'express'
import { postUpsertOne, postBulkDelete, getCurrentCards } from './controllers/system/cardSync/ApplyFandomChangeController'
import { upsertOneValidator, bulkDeleteValidator } from './controllers/system/cardSync/Validators'

// システム内部用ルート設定
export function configSystemRoutes(router: Router) {
    // カード追加またはカード更新（1枚）
    router.post('/upsert', upsertOneValidator, postUpsertOne)
    // カード削除
    router.post('/bulk_delete', bulkDeleteValidator, postBulkDelete)
    // DBに存在するカード一覧
    router.get('/current_cards', getCurrentCards)
}