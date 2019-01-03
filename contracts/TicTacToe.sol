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
//        require(player1 != msg.sender);
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
        require(board[x][y] == address(0));
        // 该位置未设置过
        require(timeValid > now);
        // 时间判断
        require(msg.sender == activePlayer);
        //当前玩家
        assert(x < GAME_BOARD_SIZE && y < GAME_BOARD_SIZE);
        // 正确的位置
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
