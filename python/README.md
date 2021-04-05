### crontabの設定

sudo crontab -u stjj-aic crontab-data
※必要ライブラリ（requestsとmwparserfromhell）をpipしておくこと。

sudo /etc/init.d/cron restart (念のためcronの再起動)