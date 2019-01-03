

[TOC]

代码地址：https://github.com/bigsui/eth-game-tictactoe

联系邮箱：suibingyue@gmail.com



# 1、游戏概述

## 1 基础知识准备

1. html、css、js
2. nodejs、react
3. metamask 插件使用
4. solidity合约基本语法
5. web3.js框架
6. truffle框架
7. ganache-cli、geth(可选)
8. 

## 2 项目提高

 	1. truffle+react
 	2. 合约事件监听
 	3. 合约安全 checks-effects-iteractions
 	4. transfer&send
 	5. 如何处理转账失败
 	6. 不会前端(前端技术差)如何写页面？
 	7. 

## 3 功能预览

猜棋牌类游戏，将棋盘设置为3*3，率先连城直线的玩家获胜，每局1eth赌金，赢家赢得所有赌金，平局退回赌金

![image-20190103223715046](https://ws1.sinaimg.cn/large/006tNc79ly1fytrv1hhz2j31gt0u0472.jpg)

游戏创建成功，对方输入地址加入游戏

![image-20190103223828618](https://ws4.sinaimg.cn/large/006tNc79ly1fytrwbscu5j31e90u0qdj.jpg)

游戏开始，提示下一个玩家下棋

![image-20190103223936239](https://ws2.sinaimg.cn/large/006tNc79ly1fytrxfo428j31j60u0n6z.jpg)

错误处理：等待对方下子、位置不可以下子

![image-20190103224422321](https://ws2.sinaimg.cn/large/006tNc79ly1fyts2es992j30qg11wn0o.jpg)

率先完成直连，游戏结束

![image-20190103224157532](https://ws4.sinaimg.cn/large/006tNc79ly1fytrzwh4thj31mf0u0dsk.jpg)



# 2 合约编写

> 游戏demo仅供参考学习，该类游戏并不能进行商用，游戏涉及到的未实现部分及其他功能自行扩展

## 2.1 新建 truffle-react项目

 ```
truffle unbox react
 ```

在contracts目录下新建 TicTacToe.sol



## 2.2 创建棋盘和玩家

创建棋盘，使用二维数组【3】【3】表示，值为玩家1、2的地址

添加获取棋盘状态函数

```js
pragma solidity ^0.4.24;

contract TicTacToe {
    // 每局1eth赌金
    uint constant GAME_COST = 1 ether;
    uint8 constant GAME_BOARD_SIZE = 3;
    address[GAME_BOARD_SIZE][GAME_BOARD_SIZE] public board; //游戏面板

    address public player1;
    address public player2;

    constructor() public payable{
        require(msg.value == GAME_COST);
        player1 = msg.sender; 
    }
    
    //获取游戏面板
    function getBoard() public view returns (address[GAME_BOARD_SIZE][GAME_BOARD_SIZE]) {
        return board;
    }
}

```



## 2.3 玩家2加入游戏

加入游戏函数，添加关键字payable接受转账

限制条件：金额，玩家2！=0的时候

游戏开始，添加变量gameActive=true

设置谁先开始游戏，随机函数

```js
address public activePlayer;  //当前玩家

	// 加入游戏
    function joinGame() public payable {
        require(msg.value == GAME_COST);
        require(player1 != msg.sender);
        require(player2 == address(0));
        player2 = msg.sender;
        gameActive = true;

        //设置随机玩家
        if(block.number % 2 == 0) {
            activePlayer = player2;
        } else {
            activePlayer = player1;
        }
    }
```



## 2.4 设置棋子

以坐标设置棋子，将棋盘xy位置设置为 msg.sender

条件判断：

 * 【x】【y】必须为空；
 * 坐标阈值判断
 * 游戏状态判断

```js
function setPosition(uint8 x, uint8 y) public {
    	// 空位置
        require(board[x][y] == address(0));
         //当前玩家
        require(msg.sender == activePlayer);
       // 正确的位置
        assert(x < GAME_BOARD_SIZE && y < GAME_BOARD_SIZE);
        // 游戏开始中
        assert(gameActive);

        board[x][y] = msg.sender; 
}
```



## 2.5 游戏赢家判断

每次下棋子，都应判断是否获胜、或者平局

获胜判断：率先直连，分步骤判断。行，列，对角线，反对角线

平局判断规则：总步数等于棋盘长度

```js
function setPosition(uint8 x, uint8 y) public {
        require(board[x][y] == address(0));
      
        assert(x < GAME_BOARD_SIZE && y < GAME_BOARD_SIZE);
        // 正确的位置
    
        assert(gameActive);

        board[x][y] = msg.sender;
        steps++;
   		
    // 规则判断
        // 行 00,01,02
        for (uint8 i = 0; i < GAME_BOARD_SIZE; i++) {
            // 如果不是activePlayer，说明未获胜
            if (board[x][i] != activePlayer) {
                break;
            }
			// 如果本行都是当前玩家 00 01 02值都为player
            if (i == GAME_BOARD_SIZE - 1) {
                setWinner(activePlayer);
                return;
            }
        }
		
    	// 列规则和行一样
        // 列  01,11,21
        for (i = 0; i < GAME_BOARD_SIZE; i++) {
            if (board[i][y] != activePlayer) {
                break;
            }

            if (i == GAME_BOARD_SIZE - 1) {
                setWinner(activePlayer);
                return;
            }
        }


        // 对角线 00，11，22
        if (x == y) {
            for (i = 0; i < GAME_BOARD_SIZE; i++) {
                if (board[i][i] != activePlayer) {
                    break;
                }
                // win 如果22 = player，获胜
                if (i == GAME_BOARD_SIZE - 1) {
                    setWinner(activePlayer);
                    return;
                }
            }
        }

        // 反对角线 02，11，20
        if (x + y == GAME_BOARD_SIZE - 1) {
            for (i = 0; i < GAME_BOARD_SIZE; i++) {
                if (board[i][GAME_BOARD_SIZE - i - 1] != activePlayer) {
                    break;
                }
                // win  如果20等于player获胜
                if (i == GAME_BOARD_SIZE - 1) {
                    setWinner(activePlayer);
                    return;
                }
            }
        }

        // 平局
        if (steps == GAME_BOARD_SIZE * GAME_BOARD_SIZE) {
            // 提现
            setDraw();
            return ;
        }
		// 设置下一个玩家
        if (msg.sender == player1) {
            activePlayer = player2;
        } else {
            activePlayer = player1;
        }
    }
```



## 2.6 设置赢家，并赢得赌金

```js
function setWinner(address player) private {
        gameActive = false;
        uint payBalance = address(this).balance;
    	player.transfer(payBalance);
    }
```

## 2.7 transfer&send

**英文翻译解释**

- `someAddress.send()`and `someAddress.transfer()` are considered safe against reentrancy. While these methods still trigger code execution, the called contract is only given a stipend of 2,300 gas which is currently only enough to log an event.
- `x.transfer(y)` is equivalent to `require(x.send(y))`, it will automatically revert if the send fails.
- `someAddress.call.value(y)()` will send the provided ether and trigger code execution. The executed code is given all available gas for execution making this type of value transfer unsafe against reentrancy.

---

## 2.8 checks-effects-iteractions模式

- checks：执行前，先进行权限及安全性检查
- effects：检查通过后，对合约状态变量进行更改
- Interactions：合约状态变量更改后，在进行交互

用户已经赢得胜利，如果因网络等原因失败，用户本应该赢得100eth赌金,因transfer交易失败导致回滚，使用send，并处理失败后的处理。



## 2.8 改写setWinner

- send不会自动回滚，必须处理转账失败的情况，用户赢后，如转账失败可使用提现功能
- 使用send改写函数，setWinner和setDraw函数

```js
function setWinner(address player) private {
    gameActive = false;
    // 转账 如果发送失败，允许用户提现
    if (!player.send(this.balance)) {
        if (player == player1) {
            withDrawBalance1 = this.balance;
        } else {
            withDrawBalance2 = this.balance;
        }
    }
}

// 设置平局
function setDraw() private {
    gameActive = false;
    if (!player1.send(GAME_COST)) {
        withDrawBalance1 = GAME_COST;
    }
    if (!player2.send(GAME_COST)) {
        withDrawBalance2 = GAME_COST;
    }
}
```



## 2.9 增加提现功能 

条件：balance>0，这里可以使用transfer。思考为什么？

```js
// 允许用户提现
    function withdraw() public {
        if (msg.sender == player1) {
            // 先修改状态，在transfer
            require(withDrawBalance1 > 0);
            withDrawBalance1 = 0;
            player1.transfer(withDrawBalance1);

        } else if (msg.sender == player2) {
            require(withDrawBalance2 > 0);
            withDrawBalance2 = 0;
            player2.transfer(withDrawBalance2);
        }
    }
```



## 2.11 添加超时限制条件

如果玩家2即将要输，玩家2估计不执行下子操作或者玩家2离开游戏，怎么办？

考虑到网络的延迟 ，可自定义延迟时长

// 超时时间，3分钟不处理，判断该玩家失败，每次设置棋子后，都应该更新该时间

```js
  uint constant TIME_INTERVAL = 3 minutes;
  uint timeValid;
  constructor() public payable{
        require(msg.value == GAME_COST);
        player1 = msg.sender;
        // 超时时间判断
        timeValid = now + TIME_INTERVAL;
    }
    // 加入游戏
    function joinGame() public payable {
        require(msg.value == GAME_COST);
        require(player1 != msg.sender);
        require(player2 == address(0));
        player2 = msg.sender;
        gameActive = true;
	}
        
     function setPosition(uint8 x, uint8 y) public {
          //时间判断
        require(timeValid > now);
        timeValid = now + TIME_INTERVAL;
         ...
      }
```



## 2.12 合约事件

合约和前端页面进行交互，游戏开始结束通知，下一个玩家通知等。

通过合约发送事件，在前端监听(watch)，处理不同的事件进行页面交互

定义事件

```js
    event GameStart(address player1,address player2); // 玩家加入事件
    event NextPlayer(address nextPlayer);   // 下一个玩家
    event GameOver(address winner);    // 游戏结束事件
    event Withdraw(address to, uint balance); // 支付成功
```

在游戏玩家2加入时，发送游戏开始事件和下一个玩家事件

```js
// 加入游戏
function joinGame() public payable {
    require(msg.value == GAME_COST);
    require(player1 != msg.sender);
    require(player2 == address(0));
    player2 = msg.sender;
    gameActive = true;

    // 发送消息
    emit GameStart(player1,msg.sender);

    //时间判断
    timeValid = now + TIME_INTERVAL;

    //设置随机玩家
    if(block.number % 2 == 0) {
        activePlayer = player2;
    } else {
        activePlayer = player1;
    }
    // 发送下个玩家事件
    emit NextPlayer(activePlayer);
}
```

设置棋子最后发送下一个玩家事件

```js
function setPosition(uint8 x, uint8 y) public {
    ...
     emit NextPlayer(activePlayer);
}

```

设置winner时，发送游戏结束事件

```js
function setWinner(address player) private {
        gameActive = false;
        // 发送消息
        emit GameOver(player);
    ...
}
     // 设置平局
    function setDraw() private {
        gameActive = false;
        emit GameOver(0);
        ...
    }
```



## 2.13 非正常规则处理

如果player1 即将要输，player1停止玩游戏。player2 无法赢得赌金。

```js
  function drawback() public {
        require(timeValid < now); // 超时之后可以提现
        if (!gameActive) {
            // 如果游戏没开始，退款给创建者
            setWinner(player1);
        }else{
            //如果已经开始， 平局退款流程
            setDraw();
            // TODO 恶意退出游戏，应该退全部赌给该赢的玩家或者自定义
        }
    }
```



## 2.14 合约代码ALL

```js
pragma solidity ^0.4.24;

contract TicTacToe {
    uint constant GAME_COST = 1 ether;
    uint8 constant GAME_BOARD_SIZE = 3;
    uint constant TIME_INTERVAL = 1 minutes;

    address[GAME_BOARD_SIZE][GAME_BOARD_SIZE] public board; //游戏面板

    address public   player1;
    address public player2;
    address public activePlayer;  //当前玩家
    bool gameActive = false; // 游戏是否开始
    uint steps = 0;    //游戏步数
    uint withDrawBalance1;  //用户1余额
    uint withDrawBalance2;  //用户2余额
    uint timeValid;

    event GameStart(address player1,address player2); // 玩家加入事件
    event NextPlayer(address nextPlayer);   // 下一个玩家
    event GameOver(address winner);    // 游戏结束事件
    event Withdraw(address to, uint balance); // 支付成功

    constructor() public payable{
        require(msg.value == GAME_COST);
        player1 = msg.sender;

        // 超时时间判断
        timeValid = now + TIME_INTERVAL;
    }

    // 加入游戏
    function joinGame() public payable {
        require(msg.value == GAME_COST);
        require(player1 != msg.sender);
        require(player2 == address(0));
        player2 = msg.sender;
        gameActive = true;

        // 发送消息
        emit GameStart(player1,msg.sender);

        //时间判断
        timeValid = now + TIME_INTERVAL;

        //设置随机玩家
        if(block.number % 2 == 0) {
            activePlayer = player2;
        } else {
            activePlayer = player1;
        }
        emit NextPlayer(activePlayer);
    }

    //获取游戏面板
    function getBoard() public view returns (address[GAME_BOARD_SIZE][GAME_BOARD_SIZE]) {
        return board;
    }

    function setPosition(uint8 x, uint8 y) public {
        // 该位置未设置过
        require(board[x][y] == address(0));

        // 时间判断
        require(timeValid > now);

        //当前玩家
        require(msg.sender == activePlayer);

        // 正确的位置
        assert(x < GAME_BOARD_SIZE && y < GAME_BOARD_SIZE);
        // 游戏开始中
        assert(gameActive);

        board[x][y] = msg.sender;
        steps++;
        //时间判断
        timeValid = now + TIME_INTERVAL;


        // 行 00,01,02
        for (uint8 i = 0; i < GAME_BOARD_SIZE; i++) {
            if (board[x][i] != activePlayer) {
                break;
            }

            if (i == GAME_BOARD_SIZE - 1) {
                setWinner(activePlayer);
                return;
            }
        }

        // 列  01,11,21
        for (i = 0; i < GAME_BOARD_SIZE; i++) {
            if (board[i][y] != activePlayer) {
                break;
            }

            if (i == GAME_BOARD_SIZE - 1) {
                setWinner(activePlayer);
                return;
            }
        }


        // 对角线 00，11，22
        if (x == y) {
            for (i = 0; i < GAME_BOARD_SIZE; i++) {
                if (board[i][i] != activePlayer) {
                    break;
                }
                // win
                if (i == GAME_BOARD_SIZE - 1) {
                    setWinner(activePlayer);
                    return;
                }
            }
        }

        // 反对角线 02，11，20
        if (x + y == GAME_BOARD_SIZE - 1) {
            for (i = 0; i < GAME_BOARD_SIZE; i++) {
                if (board[i][GAME_BOARD_SIZE - i - 1] != activePlayer) {
                    break;
                }
                // win
                if (i == GAME_BOARD_SIZE - 1) {
                    setWinner(activePlayer);
                    return;
                }
            }
        }

        // 平局
        if (steps == GAME_BOARD_SIZE * GAME_BOARD_SIZE) {
            // 提现
            setDraw();
            return ;
        }

        if (msg.sender == player1) {
            activePlayer = player2;
        } else {
            activePlayer = player1;
        }
        emit NextPlayer(activePlayer);
    }

    function setWinner(address player) private {
        gameActive = false;
        // 发送消息
        emit GameOver(player);
        // 转账 如果发送失败，允许用户提现
        uint payBalance = address(this).balance;
        if (!player.send(payBalance)) {
            if (player == player1) {
                withDrawBalance1 = payBalance;
            } else {
                withDrawBalance2 = payBalance;
            }
        } else {
           emit Withdraw(player, payBalance);
        }
    }



    // 设置平局
    function setDraw() private {
        gameActive = false;
        emit GameOver(0);
        uint payBalance = address(this).balance / 2;

        // 用户1提现
        if (!player1.send(GAME_COST)) {
            withDrawBalance1 = payBalance;
        } else {
            emit Withdraw(player1, payBalance);
        }

        // 用户2 提现
        if (!player2.send(GAME_COST)) {
            withDrawBalance2 = payBalance;
        } else {
           emit Withdraw(player2, payBalance);
        }
    }

    // 允许用户提现
    function withdraw() public {
        if (msg.sender == player1) {
            // 先修改状态，在transfer
            require(withDrawBalance1 > 0);
            withDrawBalance1 = 0;
            player1.transfer(withDrawBalance1);

            // 提现消息
            emit  Withdraw(player1, withDrawBalance1);
        } else if (msg.sender == player2) {
            require(withDrawBalance2 > 0);
            withDrawBalance2 = 0;
            player2.transfer(withDrawBalance2);
            emit Withdraw(player2, withDrawBalance2);
        }
    }

    function drawback() public {
        require(timeValid < now); // 超时之后可以提现
        if (!gameActive) {
            // 如果游戏没开始，退款给创建者
            setWinner(player1);
        }else{
            //如果已经开始， 平局退款流程
            setDraw();
            // TODO 恶意退出游戏，应该退全部赌给该赢的玩家
        }
    }
}

```



# 3 小白如何写前端

github，全球最大的代码库，你想要的基本都有。

## 3.1 github搜索

TicTacToe,本例中使用react，直接搜索  TicTacToe react，按照starts排序

![image-20190103234247776](https://ws4.sinaimg.cn/large/006tNc79ly1fyttr7p02sj31oo0u0akx.jpg)



## 3.2 clone buile 项目

```
➜  temp git clone git@github.com:trihargianto/reactjs-tictactoe.git
➜  temp cd reactjs-tictactoe 
➜  npm install
➜  npm start
```



## 3.3 查看效果和代码

效果图，自带动画，重点查看点击事件

![image-20190103234703062](https://ws2.sinaimg.cn/large/006tNc79ly1fyttvn2t14j30ry0pgmxq.jpg)

```js
render() {
        const indexSquares = [0,1,2,3,4,5,6,7,8];

        var squares = indexSquares.map(function(indexSquare, i) {
            return (<Square
                value={this.state.squares[i]}
                key={i}
                index={i}
                winner={this.state.winner}
                xIsNext={this.state.xIsNext}
                onClick={this.handleOnClick.bind(this)} />)
        },this)

        return (
            <div>
                <h1 style={{textAlign: 'center', fontSize: '46px', color: 'rgba(52, 152, 219,1.0)'}} className="animated flipInY">Tic-Tac-Toe</h1>
                <h3 style={{textAlign: 'center'}} id="titlePemenang">{this.state.winner !== null ? <span>Pemenangnya <b>{this.state.winner}</b></span> : ""}</h3>
                <div className="container animated fadeInUp">
                    <div className="row">
                        <br />
                        <div className="col-xs-12">{squares}</div>
                    </div>
                </div>
                <br />
                {this.state.winner !== null || this.state.full === true ? <ResetButton onClick={this.handleResetGame.bind(this)} /> : ""}
            </div>
        )
    }
}
```



![image-20190103235024205](https://ws2.sinaimg.cn/large/006tNc79ly1fyttz4vtx6j319m0s67af.jpg)



# 4 前端页面编写

## 4.1 页面样式

拷贝下载下来的git项目(别忘了css文件一同拷贝)，安装包

```
"bootstrap": "^3.3.7",
"jquery": "^3.2.1",
"react": "^15.4.2",
"react-dom": "^15.4.2",
```

运行项目，查看页面

略

## 4.2 调整页面

通过代码，得知，原页面的棋盘的值为0-8，我们改为[[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]]，每个value即棋盘的坐标。同时更改Square的handleClick，把值传递到页面。

运行项目，点击第一个模块，显示log 0,1

剩下的就是与合约交互。

```js

class Board extends React.Component {

    constructor() {
        super();

        this.state = {
            squares : Array(9).fill(null),
            xIsNext : true,
            winner  : null,
            full    : false
        }
    }

    handleOnClick(index, turn) {
        console.log(index,turn)
    }
   
    handleResetGame() {
        window.location.reload()
    }

    render() {
        const indexSquares = [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]];

        var squares = indexSquares.map(function(indexSquare, i) {
            return (<Square
                value={this.state.squares[i]}
                key={i}
                index={i}
                winner={this.state.winner}
                xIsNext={this.state.xIsNext}
                onClick={this.handleOnClick.bind(this)} />)
        },this)

        return (
            <div>
                <h1 style={{textAlign: 'center', fontSize: '46px', color: 'rgba(52, 152, 219,1.0)'}} className="animated flipInY">Tic-Tac-Toe</h1>
                <h3 style={{textAlign: 'center'}} id="titlePemenang">{this.state.winner !== null ? <span>Pemenangnya <b>{this.state.winner}</b></span> : ""}</h3>
                <div className="container animated fadeInUp">
                    <div className="row">
                        <br />
                        <div className="col-xs-12">{squares}</div>
                    </div>
                </div>
                <br />
                {this.state.winner !== null || this.state.full === true ? <ResetButton onClick={this.handleResetGame.bind(this)} /> : ""}
            </div>
        )
    }
}
```

## 4.3 下载项目引用包

```js
"truffle-contract": "^3.0.7",
"web3": "^1.0.0-beta.37",
"xmlhttprequest": "^1.8.0"
```



## 4.4 搭建框架

补充页面按钮，更新square

```js
import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import './animate.css'
import Square from './Square'
import MenuButtons from './MenuButtons'
import getWeb3 from "./utils/getWeb3"
import contract from 'truffle-contract'
import _TicTacToe from './contracts/TicTacToe.json'


// 棋盘值
const STONES = [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]];
const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000"
const GAME_COST = "1"; //1 eth
let web3 = null

class Board extends React.Component {

    state = {
        accounts: null, // 账户

        // 棋盘相关
        instance: null, // 游戏实例
        board: [['', '', ''], ['', '', ''], ['', '', '']],
        player1: '', // 玩家一，等于创建者
        player2: '', // 玩家二，
        nextPlayer: '',// 该谁下棋

        winner: '',
        gameResult: '', // 游戏结果，
    }

    // 获取合约
    getTicTacToe = () => {
        let TicTacToe = contract(_TicTacToe)
        TicTacToe.setProvider(web3.currentProvider);
        return TicTacToe
    }

    componentDidMount = async () => {
        try {
            web3 = await getWeb3();
            console.log("currentProvider", web3.currentProvider)
            const accounts = await web3.eth.getAccounts();
            console.log("accounts", accounts)
            this.setState({accounts});
        } catch (error) {
            alert(`web3 加载失败`,);
            console.error(error);
        }
    }

    componentWillUnmount() {
        this.unRegistNextPlayerEvent()
    }

    // 点击创建游戏
    onCreateGameClick = () => {
        console.log("创建游戏")
    }

    // 加入游戏
    onJoinGameClick = async () => {
        console.log("加入游戏")
    }

    // 更新游戏面板
    updateBoard = () => {
        console.log("更新面板")
    }

    // 设置棋盘
    onStoneClick = (stone) => {
        console.log("设置棋盘",stone)
    }

    // 重置游戏
    onResetGameClick = () => {
        window.location.reload()
    }

    // 设置赢家
    setWinner = (winner) => {
        let gameResult = ""
        if (winner === this.state.player1) {
            gameResult = "恭喜胜利，再来一局"
        } else if (winner === this.state.player2) {
            gameResult = "失败，再接再厉"
        } else {
            gameResult = "旗鼓相当，平局，再来一局"
        }
        this.setState({gameResult})
    }

    // 00 01 02
    // 10 11 12
    // 20 21 22
    render() {
        let {accounts, board, player1, player2, nextPlayer, instance, winner} = this.state
        let gameAddress = instance == null ? "" : instance.address
        console.log("state", this.state)
        console.log("", instance)
        if (winner != ''){
            winner = winner == EMPTY_ADDRESS ? "平局，退回赌金" : "赢家为："+winner
        }
        let squares = STONES.map((stone, i) => {
            return (<Square
                key={i}
                stone={stone}
                board={board}
                account={accounts == null ? null : accounts[0]}
                nextPlayer={nextPlayer}
                onClick={this.onStoneClick}/>)
        })

        return (
            <div style={{textAlign: 'center'}}>
                {/*标题*/}
                <h2 style={{fontSize: '42px', color: "red"}}
                    className="animated flipInY">性感荷官 在线发牌
                </h2>
                {/* 游戏信息展示*/}
                <div>
                    <h5>当前用户:{accounts == null ? "未检测到" : accounts[0]}</h5>
                    <h5>游戏地址:{gameAddress == "" ? "等待创建" : gameAddress}</h5>
                    <h5>player1:{player1 == "" ? "等待加入" : player1}</h5>
                    <h5>player2:{player2 == "" ? "等待加入" : player2}</h5>
                    <h5>nextPlayer:{player2 == "" ? "游戏未开始" :
                        <span style={{color: "red"}}>{nextPlayer}</span>}</h5>
                    <h3 id="gameResult">
                        <span style={{fontSize: '32px', color: "red"}}>
                            <b>{winner}</b></span>
                    </h3>
                </div>
                {/*棋盘*/}
                <div className="container animated fadeInUp">
                    <div className="row">
                        <div className="col-xs-12">{squares}</div>
                    </div>
                </div>
                <br/>

                <MenuButtons
                    onCreateGameClick={this.onCreateGameClick}
                    onJoinGameClick={this.onJoinGameClick}
                    onResetGameClick={this.onResetGameClick}/>
            </div>
        )
    }
}

ReactDOM.render(
    <Board/>,
    document.getElementById('root')
);

```

Square.js

**es6语法普及，封包与解包**

```js

import React from 'react';

const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000"
export default class Square extends React.Component {

    constructor(props) {
        super(props)
        // es6 语法
        // 本页面要设置状态，用户点击，提前显示该位置内容，避免等待，如不需要否则可直接使用props或者无状态组件
        // 保存所有属性到状态变量
        this.state = {...props}

        // 等价
        // let {key,stone,board,account,nextPlayer,onClick}=props
        // this.state = {key,stone,board,account,nextPlayer,onClick}
        console.log(this.state)
    }


    componentWillReceiveProps(nextProps) {
        this.state = {...nextProps}
    }

    // 状态变量未Object,可以不写默认值，
    state = {}
    
    // 点击事件
    onItemClick(event) {
        let errMsg = this.mustCheck()
        if (errMsg != "") {
            event.target.className += " animated shake";
            alert(errMsg)
            return
        }
        // 引用点击
        this.state.onClick(this.state.stone);
        // 设置 修改
        event.target.className += " animated rubberBand square-container-active";
    }

    // 下棋校验，返回错误信息，没有返回空
    mustCheck() {
        let {account, nextPlayer} = this.state
        console.log(this.state)
        if (this.state.account == null) {
            return "用户未登录"
        }

        if (nextPlayer == '') {
            return "游戏未开始"
        }

        if (account.toLowerCase() != nextPlayer.toLowerCase()) {
            return "等待对方下子"
        }
        if (this.getHtmlValue() != '') {
            return "这里不能下子"
        }
        return ""
    }

    // 获取该位置的文本显示
    getHtmlValue() {
        let {stone, board, account,nextPlayer} = this.state
        // 获取该位置的地址值
        let x = stone[0]
        let y = stone[1]
        let stoneValue = board[x][y]

        // 未登录显示空
        if (account == null||nextPlayer==""||stoneValue==EMPTY_ADDRESS||stoneValue==""){
            return ""
        }
        console.log(x,y,stoneValue==EMPTY_ADDRESS,stoneValue)
        // 自己显示X，否则显示O
        return stoneValue.toString().toLowerCase() == account.toString().toLowerCase() ? 'X' : 'O'
    }

    render() {
        let stoneHtmlValue = this.getHtmlValue()
        return (
            <div onClick={this.onItemClick.bind(this)} className="col-xs-4 square-container">
                {stoneHtmlValue}
            </div>
        )
    }
}
```



## 4.5 创建游戏,监听事件

- 第一种方式GameOver.watch(function(error,event){})

- 第二种方式allEvents(function(error,event){})

- 第三种方式 调用函数返回值的logs字段
- 第四中，web3.js 中subscribe

```js
// 点击创建游戏，监听合约事件
// 通过打印instance，可以看到合约中的每个事件，都提供了一个方法
    onCreateGameClick = () => {

        const {accounts} = this.state
        let TicTacToe = this.getTicTacToe()
        TicTacToe.new({from: accounts[0], value: web3.utils.toWei(GAME_COST, "ether")})
            .then(instance => {
                console.log("instance", instance)
                this.setState({instance, player1: accounts[0]})
                this.registEvent()
                alert("游戏创建成功，邀请好友\n" + instance.address)
            })
            .catch(error => {
                console.log("new TicTacToe", error)
            })
    }
```

![image-20190104001206279](https://ws1.sinaimg.cn/large/006tNc79ly1fytulp3ykij31kc0ckadu.jpg)



* 第二种方式allEvents(function(error,event){})

```js
// 注册事件，监听所有（也可以单独监听）
registEvent = () => {
    let {instance, accounts} = this.state
    instance.allEvents( (err,data)=> {
        console.log(err,data)
        let {event, args} = data
        if (event == "GameStart") {
            alert("游戏即将开始\n" + "玩家1: " + args.player1 + "\n玩家2: " + args.player2)
            this.setState({...args})
        } else if (event == "NextPlayer") {
            alert("下一个玩家\n" + args.nextPlayer)
            this.updateBoard()
            this.setState({...args})
        } else if (event == "GameOver") {
            this.setState({...args})
            alert("GameOver")
        } else if (event == "Withdraw") {
            alert("游戏结束\n已向" + args.to + "转入赌金" + args.balance)
        }
    })
}
```

## 4.6 加入游戏

```js
// 加入游戏
    onJoinGameClick = async () => {
        let gameAddress = prompt("请输入游戏地址")
        if (gameAddress === "") {
            return
        }
        let {accounts} = this.state;
        let TicTacToe = this.getTicTacToe()
        try {
            // 获取合约实例
            let instance = await TicTacToe.at(gameAddress)
            console.log("at", instance == null, instance)

            // 更新状态，监听事件
            this.setState({instance})
            this.registEvent()
            alert("游戏加载成功，加入赌金立即开始游戏")
            let result = await instance.joinGame({
                from: accounts[0],
                value: web3.utils.toWei(GAME_COST, 'ether')
            })
        } catch (e) {
            console.log("join error", e)
            this.setState({instance: null})
        }
    }

```



## 4.7 加入游戏

```js
 // 更新游戏面板
    updateBoard = () => {
        let {instance, accounts} = this.state
        instance.getBoard.call({from: accounts[0]})
            .then(board => {
                // 更新面板
                this.setState({board})
                console.log("updateBoard", board)
            })
            .catch(error => {
                console.error("updateBoard", error)
            })
    }
```



## 4.8 设置棋盘

事件方式3，通过调用函数的返回result，其中的字段logs 封装了该函数调用产生的logs

```js
// 设置棋盘
onStoneClick = (stone) => {
    console.log("onStoneClick", stone)
    let {instance, accounts} = this.state
    instance.setPosition(stone[0], stone[1], {from: accounts[0]})
        .then(result => {
            console.log("setStone", result)
            // this.handleLog(result.logs)
            // 通过事件，也可以直接处理log
        })
        .catch(error => {
            console.error("setStone", error)
        })
}
```



## 4.9 设置赢家



```js
// 设置赢家或者平局
setWinner = (winner) => {
    let gameResult = ""
    if (winner === this.state.player1) {
        gameResult = "恭喜胜利，再来一局"
    } else if (winner === this.state.player2) {
        gameResult = "失败，再接再厉"
    } else {
        gameResult = "旗鼓相当，平局，再来一局"
    }
    this.setState({gameResult})
}
```



4.9 监听event方式2

```js
// 下一个玩家，更新页面
registNextPlayerEvent = () => {
    let {instance} = this.state
    let nextPlayerEvent = instance.NextPlayer()
    //  下一个是一个状态 需保存到state
    this.setState(nextPlayerEvent)
    event.watch((error, event) => {
        console.log("event---NextPlayer")
        if (error == null) {
            console.log("NextPlayer", event)
        } else {
            console.error("event", error)
        }
    })
}

// 取消下一个玩家监听
unRegistNextPlayerEvent = () => {
    let {nextPlayerEvent} = this.state
    if (nextPlayerEvent != null) {
        nextPlayerEvent.stopWatching()
    }
}

// 游戏结束事件，只需监听一次
registGameOverEvent = () => {
    let {instance} = this.state
    let event = instance.GameOver()
    event.watch((error, event) => {
        console.log("GameOverEvent", event)
        if (error == null) {
            event.stopWatching()
            this.unRegistNextPlayerEvent()
        } else {
            console.error("event", error)
        }
    })
}

// 游戏结束提现事件 ，只需一次监听
registWithdrawEvent = () => {
    let {instance} = this.state
    let event = instance.WithdrawEvent()
    event.watch((error, event) => {
        console.log("WithdrawEvent")
        if (error == null) {
            alert("有钱到账了")
            event.stopWatching()
            console.log("WithDrawEvent", event)
        } else {
            console.error("event", error)
        }
    })
}
```



## 4.10 完整代码

```js
import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import './animate.css'
import Square from './Square'
import MenuButtons from './MenuButtons'
import getWeb3 from "./utils/getWeb3"
import contract from 'truffle-contract'
import _TicTacToe from './contracts/TicTacToe.json'


// 棋盘值
const STONES = [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]];
const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000"
const GAME_COST = "1"; //1 eth
let web3 = null

class Board extends React.Component {

    state = {
        accounts: null, // 账户

        // 棋盘相关
        instance: null, // 游戏实例
        board: [['', '', ''], ['', '', ''], ['', '', '']],
        player1: '', // 玩家一，等于创建者
        player2: '', // 玩家二，
        nextPlayer: '',// 该谁下棋

        winner: '',
        gameResult: '', // 游戏结果，
    }

    // 获取合约
    getTicTacToe = () => {
        let TicTacToe = contract(_TicTacToe)
        TicTacToe.setProvider(web3.currentProvider);
        return TicTacToe
    }

    componentDidMount = async () => {
        try {
            web3 = await getWeb3();
            console.log("currentProvider", web3.currentProvider)
            const accounts = await web3.eth.getAccounts();
            console.log("accounts", accounts)
            this.setState({accounts});
        } catch (error) {
            alert(`web3 加载失败`,);
            console.error(error);
        }
    }

    componentWillUnmount() {
        this.unRegistNextPlayerEvent()
    }

    // 点击创建游戏
    onCreateGameClick = () => {

        const {accounts} = this.state
        let TicTacToe = this.getTicTacToe()
        TicTacToe.new({from: accounts[0], value: web3.utils.toWei(GAME_COST, "ether")})
            .then(instance => {
                console.log("instance", instance)
                this.setState({instance, player1: accounts[0]})
                this.registEvent()
                alert("游戏创建成功，邀请好友\n" + instance.address)
            })
            .catch(error => {
                console.log("new TicTacToe", error)
            })
    }

    // 加入游戏
    onJoinGameClick = async () => {
        let gameAddress = prompt("请输入游戏地址")
        if (gameAddress === "") {
            return
        }
        let {accounts} = this.state;
        let TicTacToe = this.getTicTacToe()
        try {
            // 获取合约实例
            let instance = await TicTacToe.at(gameAddress)
            console.log("at", instance == null, instance)

            // 更新状态，监听事件
            this.setState({instance})
            this.registEvent()
            alert("游戏加载成功，加入赌金立即开始游戏")
            let result = await instance.joinGame({
                from: accounts[0],
                value: web3.utils.toWei(GAME_COST, 'ether')
            })
        } catch (e) {
            console.log("join error", e)
            this.setState({instance: null})
        }
    }

    // 更新游戏面板
    updateBoard = () => {
        let {instance, accounts} = this.state
        instance.getBoard.call({from: accounts[0]})
            .then(board => {
                // 更新面板
                this.setState({board})
                console.log("updateBoard", board)
            })
            .catch(error => {
                console.error("updateBoard", error)
            })
    }

    // 设置棋盘
    onStoneClick = (stone) => {
        console.log("onStoneClick", stone)
        let {instance, accounts} = this.state
        instance.setPosition(stone[0], stone[1], {from: accounts[0]})
            .then(result => {
                console.log("setStone", result)
                // this.handleLog(result.logs)
                // 通过事件，也可以直接处理log
            })
            .catch(error => {
                console.error("setStone", error)
            })
    }

    // 重置游戏
    onResetGameClick = () => {
        window.location.reload()
    }

    // 设置赢家
    setWinner = (winner) => {
        let gameResult = ""
        if (winner === this.state.player1) {
            gameResult = "恭喜胜利，再来一局"
        } else if (winner === this.state.player2) {
            gameResult = "失败，再接再厉"
        } else {
            gameResult = "旗鼓相当，平局，再来一局"
        }
        this.setState({gameResult})
    }

    // 注册事件，监听所有（也可以单独监听）
    registEvent = () => {
        let {instance, accounts} = this.state
        instance.allEvents( (err,data)=> {
            console.log(err,data)
            let {event, args} = data
            if (event == "GameStart") {
                alert("游戏即将开始\n" + "玩家1: " + args.player1 + "\n玩家2: " + args.player2)
                this.setState({...args})
            } else if (event == "NextPlayer") {
                alert("下一个玩家\n" + args.nextPlayer)
                this.updateBoard()
                this.setState({...args})
            } else if (event == "GameOver") {
                this.setState({...args})
                alert("GameOver")
            } else if (event == "Withdraw") {
                alert("游戏结束\n已向" + args.to + "转入赌金" + args.balance)
            }
        })
    }

    // 下一个玩家，更新页面
    registNextPlayerEvent = () => {
        let {instance} = this.state
        let nextPlayerEvent = instance.NextPlayer()
        //  下一个是一个状态 需保存到state
        this.setState(nextPlayerEvent)
        event.watch((error, event) => {
            console.log("event---NextPlayer")
            if (error == null) {
                console.log("NextPlayer", event)
            } else {
                console.error("event", error)
            }
        })
    }

    // 取消下一个玩家监听
    unRegistNextPlayerEvent = () => {
        let {nextPlayerEvent} = this.state
        if (nextPlayerEvent != null) {
            nextPlayerEvent.stopWatching()
        }
    }

    // 游戏结束事件，只需监听一次
    registGameOverEvent = () => {
        let {instance} = this.state
        let event = instance.GameOver()
        event.watch((error, event) => {
            console.log("GameOverEvent", event)
            if (error == null) {
                event.stopWatching()
                this.unRegistNextPlayerEvent()
            } else {
                console.error("event", error)
            }
        })
    }

    // 游戏结束提现事件 ，只需一次监听
    registWithdrawEvent = () => {
        let {instance} = this.state
        let event = instance.WithdrawEvent()
        event.watch((error, event) => {
            console.log("WithdrawEvent")
            if (error == null) {
                alert("有钱到账了")
                event.stopWatching()
                console.log("WithDrawEvent", event)
            } else {
                console.error("event", error)
            }
        })
    }

    // 00 01 02
    // 10 11 12
    // 20 21 22
    render() {
        let {accounts, board, player1, player2, nextPlayer, instance, winner} = this.state
        let gameAddress = instance == null ? "" : instance.address
        console.log("state", this.state)
        console.log("", instance)
        if (winner != ''){
            winner = winner == EMPTY_ADDRESS ? "平局，退回赌金" : "赢家为："+winner
        }
        let squares = STONES.map((stone, i) => {
            return (<Square
                key={i}
                stone={stone}
                board={board}
                account={accounts == null ? null : accounts[0]}
                nextPlayer={nextPlayer}
                onClick={this.onStoneClick}/>)
        })

        return (
            <div style={{textAlign: 'center'}}>
                {/*标题*/}
                <h2 style={{fontSize: '42px', color: "red"}}
                    className="animated flipInY">性感荷官 在线发牌
                </h2>
                {/* 游戏信息展示*/}
                <div>
                    <h5>当前用户:{accounts == null ? "未检测到" : accounts[0]}</h5>
                    <h5>游戏地址:{gameAddress == "" ? "等待创建" : gameAddress}</h5>
                    <h5>player1:{player1 == "" ? "等待加入" : player1}</h5>
                    <h5>player2:{player2 == "" ? "等待加入" : player2}</h5>
                    <h5>nextPlayer:{player2 == "" ? "游戏未开始" :
                        <span style={{color: "red"}}>{nextPlayer}</span>}</h5>
                    <h3 id="gameResult">
                        <span style={{fontSize: '32px', color: "red"}}>
                            <b>{winner}</b></span>
                    </h3>
                </div>
                {/*棋盘*/}
                <div className="container animated fadeInUp">
                    <div className="row">
                        <div className="col-xs-12">{squares}</div>
                    </div>
                </div>
                <br/>

                <MenuButtons
                    onCreateGameClick={this.onCreateGameClick}
                    onJoinGameClick={this.onJoinGameClick}
                    onResetGameClick={this.onResetGameClick}/>
            </div>
        )
    }
}

ReactDOM.render(
    <Board/>,
    document.getElementById('root')
);
```





# 5 作业

剩余时间显示

玩家超时(或者故意退出)处理

页面刷新，加载游戏状态。



# 6 游戏扩展

## 游戏设计

2名玩家，在一个10*10的棋盘，猜对方部署的飞机，优先全部猜中的获胜

- 增加钱包功能（前面可能有分享到）
- 创建游戏合约(可先创建平台，平台中创建游戏)，邀请好友
- 大小 10*10
- 不许重复下棋
- 棋子按照飞机规则部署。
- 部署完毕后，准备游戏
- 双方都准备完毕，游戏开始
- 超时3分钟，超时失去猜子机会

<img src = "https://ws4.sinaimg.cn/large/006tNbRwly1fymmfodc66j30na0iqwfa.jpg" width=500>





# 7 项目扩展

eth游戏平台，玩家玩游戏，开发社申请发布游戏。

**由于真实以太坊的延迟，并不适合实时性要求较强类的游戏**

- 网页

  - 用户模式
    - 钱包
    - 玩游戏
  - 开发者模式
    - 钱包
    - 申请开发者
    - 申请上架
    - 佣金提现
  - 管理员模式
    - 代币管理
    - 佣金管理
    - 游戏审批
    - 开发者审批
    - 仲裁管理

- android

- ios

- 微信


