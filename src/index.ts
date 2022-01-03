import express from 'express'
import fs from 'fs'
import http from 'http'
import https from 'https'
import compression = require('compression')
import { configRoutes } from './webRoutes'
import { configSystemRoutes } from './systemRoutes'
import morgan = require('morgan')
import { logger } from './logger'

// 以下、ポートとか証明書とか設定して実行（引数でローカル環境か本番環境か分岐）
if (process.argv.includes('--env=local')) {
    /**
     * 外部公開用Expressアプリ設定（ローカル環境実行用）
     */
    // Expressアプリの生成
    const webApp: express.Express = express()
    // HTTPログをmorganからwinstonに流す
    webApp.use(
        morgan('', {
            stream: {
                write: message => logger.info(message.trim()),
            },
        })
    );
    // 圧縮ミドルウェア設定
    webApp.use(compression())
    // bodyパーサ用ミドルウェア設定
    webApp.use(express.json())
    webApp.use(express.urlencoded({ extended: true }))
    // CORS設定
    webApp.use(function(req, res, next) {
        // res.header('Access-Control-Allow-Origin', 'https://localhost:8080')
        res.header('Access-Control-Allow-Origin', '*') // todo CORS設定が上記で動くようにする
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
        next()
    })
    // ルータ生成
    const webRouter: express.Router = express.Router()
    // ルート設定
    configRoutes(webRouter)
    // Expressアプリにルータを登録
    webApp.use(webRouter)
    // 本番環境でないためオレオレ証明書で実行する
    const testcert = {
        key: fs.readFileSync('/usr/local/ssl/private/key.pem'),
        cert: fs.readFileSync('/usr/local/ssl/certs/cert.pem')
    }
    // ポート443で証明書を設定してExpressアプリ開始
    https.createServer(testcert, webApp).listen(443)

} else if (process.argv.includes('--env=prod')) {
    /**
     * 外部公開用Expressアプリ設定（本番環境実行用）
     */
    // Expressアプリの生成
    const webApp: express.Express = express()
    // HTTPログをmorganからwinstonに流す
    webApp.use(
        morgan('', {
            stream: {
                write: message => logger.info(message.trim()),
            },
        })
    );
    // 圧縮ミドルウェア設定
    webApp.use(compression())
    // bodyパーサ用ミドルウェア設定
    webApp.use(express.json())
    webApp.use(express.urlencoded({ extended: true }))
    // CORS設定（STJJ.AICのフロントエンドに絞る）
    webApp.use(function(req, res, next) {
        res.header('Access-Control-Allow-Origin', 'https://www.scptcgjpj.ga')
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
        next()
    })
    // ルータ生成
    const webRouter: express.Router = express.Router()
    // ルート設定
    configRoutes(webRouter)
    // Expressアプリにルータを登録
    webApp.use(webRouter)
    // 本番環境のため、greenlockで証明書を取得してポート443で実行する
    require('greenlock-express')
        .init({
            packageRoot: '/var/www/stjj-aic-server',
            maintainerEmail: 'scptcgjpjwiki@gmail.com',
            configDir: './greenlock.d',
            cluster: false
        })
        .serve(webApp)
} else {
    throw Error('実行オプションに--env=localか--env=prodをつけてください')
}

/**
 * カードデータ同期用Expressアプリ設定
 */
// Expressアプリの生成
const systemApp: express.Express = express()
// HTTPログをmorganからwinstonに流す
systemApp.use(
    morgan('', {
        stream: {
            write: message => logger.info(message.trim()),
        },
    })
);
// 圧縮ミドルウェア設定
systemApp.use(compression())
// bodyパーサ用ミドルウェア設定
systemApp.use(express.json())
systemApp.use(express.urlencoded({ extended: true }))
// ルータ生成
const systemRouter: express.Router = express.Router()
// ルート設定
configSystemRoutes(systemRouter)
// Expressアプリにルータを登録
systemApp.use(systemRouter)
http.createServer(systemApp).listen(55000)