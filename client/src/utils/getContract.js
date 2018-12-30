import contract from "truffle-contract"

import _TicTacToe from '../contracts/TicTacToe'


let getTicTacToe =()=> contract(_TicTacToe)


export {
    getTicTacToe
}