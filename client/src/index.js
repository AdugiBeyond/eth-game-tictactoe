import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import './animate.css'
import Square from './Square'
import ResetButton from './ResetButton'

import TicTacToe from './contracts/SimpleStorage'
import getWeb3 from "./utils/getWeb3";

class Board extends React.Component {

    state = {
        accounts: null,
        player1: null,
        player2: null,
        board: null,
        instance: null,
        squares: Array(9).fill(null),
        xIsNext: true,
        winner: null,
        full: false,
        event: {}
    }

    componentDidMount = async () => {
        return true
        try {

            const web3 = await getWeb3();
            const accounts = await web3.eth.getAccounts();
            this.setState({web3, accounts});
        } catch (error) {
            alert(`web3 加载失败`,);
            console.error(error);
        }
    };

    createGame = async () => {
        const {accounts, web3} = this.state;
        // const networkId = await web3.eth.net.getId();
        // const deployedNetwork = TicTacToe.networks[networkId];
        // const instance = new web3.eth.Contract(
        //     TicTacToe.abi,
        //     deployedNetwork && deployedNetwork.address,
        //     from:player1,
        //     value:web3.utils.toWei(1, 'ether'),
        // );
        TicTacToe.new({from: accounts[0], value: web3.utils.toWei(1, 'ether'), gas: 300000})
            .then(instance => {
                this.setState({instance})
            }).catch(error => {
            console.log("new", error)
        })
    }


    joinGame = () => {
        let gameAddress = prompt("请输入游戏地址")
        if (gameAddress === "") {
            return
        }
        let {accounts} = this.state;
        TicTacToe.at(gameAddress)
            .then(instance => {
                return instance.methods.joinGame.send({
                    from: accounts[0],
                    value: web3.utils.toWei(1, 'ether'),
                    gas: 300000
                })
            })
            .then(result => {
                console.log(result)
                this.setState({instance, player2: player})
            })
            .catch(error => {
                console.error("join", error)
            })

    }

    handleOnClick(index, turn) {

        const newSquares = this.state.squares.slice();
        newSquares[index] = turn;

        var winner = this.calculateWinner(newSquares);

        this.setState({
            xIsNext: !this.state.xIsNext,
            squares: newSquares,
            winner: winner !== null ? winner : this.state.winner
        });

        if (winner !== null) {
            document.getElementById('titlePemenang').className = "animated rotateIn";
        }
    }

    setStone = (event) => {
        console.log(event)
        let {instance, accounts} = this.state
        instance.methods.setStone(event.x, event.y).send({from: accounts[0]})
            .then(result => {
                console.log("setStone", result)
            })
            .catch(error => {
                console.error("setStone", error)
            })
    }

    getBoard = () => {
        let {instance, accounts} = this.state
        instance.methods.getBoard.call({from: accounts[0]})
            .then(board => {
                // 更新游戏棋盘
                this.setState({board})
                console.log("getBoard", result)
            })
            .catch(error => {
                console.error("getBoard", error)
            })
    }

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
    registEvent = () => {
        let {instance} = this.state
        // 玩家加入游戏
        instance.PlayerJoined().watch((error, event) => {
            if (error != null) {
                console.log(event)
            } else {
                console.error("event", error)
            }
        })

        // 下一个玩家
        instance.NextPlayer().watch((error, event) => {
            if (error != null) {
                console.log(event)
                // 停止 listen joinevent
            } else {
                console.error("event", error)
            }
        })

        // 游戏结束
        instance.GameOverWithWin().watch((error, event) => {
            if (error != null) {
                console.log(event)
                this.setState({board: null})

                // stop listen next player event and self
            } else {
                console.error("event", error)
            }
        })

        // 体现成功
        instance.GameOverWithDraw().watch((error, event) => {
            if (error != null) {
                console.log(event)
                // stop listen self
            } else {
                console.error("event", error)
            }
        })
    }


    calculateWinner(squares) {
        const lines = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6]
        ];

        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];

            if (squares[a] !== null && squares[b] !== null && squares[c] !== null) {
                if (squares[a] === squares[b] && squares[a] === squares[c] && squares[b] === squares[c]) {
                    return squares[a];
                }
            }
        }

        if (squares.every(function (el) {
            let arg = el !== null ? true : false;
            return arg;
        })) {
            this.setState({
                full: true
            })
        }
        ;

        return null;
    }

    onResetGameClick = () => {
        window.location.reload()
    }

    render() {

        // 00 01 02
        // 10 11 12
        // 20 21 22
        const indexSquares = [0, 1, 2, 3, 4, 5, 6, 7, 8];

        var squares = indexSquares.map(function (indexSquare, i) {
            return (<Square
                value={this.state.squares[i]}
                key={i}
                index={i}
                winner={this.state.winner}
                xIsNext={this.state.xIsNext}
                onClick={this.handleOnClick.bind(this)}/>)
        }, this)

        return (
            <div>
                <h1 style={{textAlign: 'center', fontSize: '46px', color: 'rgba(52, 152, 219,1.0)'}}
                    className="animated flipInY">Tic-Tac-Toe</h1>
                <h3 style={{textAlign: 'center'}} id="titlePemenang">{this.state.winner !== null ?
                    <span>Pemenangnya <b>{this.state.winner}</b></span> : ""}</h3>
                <div className="container animated fadeInUp">
                    <div className="row">
                        <br/>
                        <div className="col-xs-12">{squares}</div>
                    </div>
                </div>
                <br/>
                <ResetButton onClick={this.onResetGameClick}/> : ""}
            </div>
        )
    }
}

ReactDOM.render(
    <Board/>,
    document.getElementById('root')
);
