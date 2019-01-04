

# 预览

猜棋牌类游戏，将棋盘设置为3*3，率先连城直线的玩家获胜，每局1eth赌金，赢家赢得所有赌金，平局退回赌金

![image-20190103223715046](https://ws1.sinaimg.cn/large/006tNc79ly1fytrv1hhz2j31gt0u0472.jpg)



游戏创建成功，对方输入地址加入游戏

![image-20190103223828618](https://ws4.sinaimg.cn/large/006tNc79ly1fytrwbscu5j31e90u0qdj.jpg)



游戏开始，提示下一个玩家下棋

![image-20190103223936239](https://ws2.sinaimg.cn/large/006tNc79ly1fytrxfo428j31j60u0n6z.jpg)



错误处理：等待对方下子、已经有棋子位置不可以下子

![image-20190103224422321](https://ws2.sinaimg.cn/large/006tNc79ly1fyts2es992j30qg11wn0o.jpg)



率先完成直连，游戏结束

![image-20190103224157532](https://ws4.sinaimg.cn/large/006tNc79ly1fytrzwh4thj31mf0u0dsk.jpg)



#



# 下载



```
git clone git@github.com:bigsui/eth-game-tictactoe.git
```



# 编译

```
truffle develop
> compile
```

记住端口



# metamask 链接 truffle

truffle 默认端口为9545，请自行查看

```
truffle develop
```

打开metamask，设置自定义网络，链接truffle develop，并导入两个账号



# 安装npm包

```
cd client
npm install
npm start
```



# 注意

由于google浏览器，开启两个窗口，当切换metamask用户时，页面会自动刷新，

请另开一个Firefox浏览器，安装metamask 链接并导入账户



player1 google浏览器

player2 Firefox浏览器

即可