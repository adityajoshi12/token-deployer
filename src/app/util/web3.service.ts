import { Injectable } from "@angular/core";
import { BehaviorSubject, Subject } from "rxjs";
import Web3 from "web3";
import * as code from "../code.json";
declare let window: any;
declare let web3: any;

@Injectable()
export class Web3Service {
  private web3: Web3;
  private accounts: string[];
  public ready = false;

  public accountsObservable = new Subject<string[]>();
  public tranactionHash = new BehaviorSubject<string>("");
  constructor() {
    window.addEventListener("load", (event) => {
      this.bootstrapWeb3();
    });
  }

  public bootstrapWeb3() {
    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof window.ethereum !== "undefined") {
      // Use Mist/MetaMask's provider
      window.ethereum.enable().then(() => {
        this.web3 = new Web3(window.ethereum);
        web3 = this.web3;
      });
    } else {
      console.log("No web3? You should consider trying MetaMask!");

      // Hack to provide backwards compatibility for Truffle, which uses web3js 0.20.x
      Web3.providers.HttpProvider.prototype.sendAsync =
        Web3.providers.HttpProvider.prototype.send;
      // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
      this.web3 = new Web3(
        new Web3.providers.HttpProvider("http://localhost:8545")
      );
    }

    setInterval(() => this.refreshAccounts(), 10000);
  }

  private async refreshAccounts() {
    const accs = await this.web3.eth.getAccounts();
    console.log("Refreshing accounts");

    // Get the initial account balance so it can be displayed.
    if (accs.length === 0) {
      console.warn(
        "Couldn't get any accounts! Make sure your Ethereum client is configured correctly."
      );
      return;
    }

    if (
      !this.accounts ||
      this.accounts.length !== accs.length ||
      this.accounts[0] !== accs[0]
    ) {
      console.log("Observed new accounts");
      console.log(accs);
      this.accountsObservable.next(accs);
      this.accounts = accs;
    }

    this.ready = true;
  }

  async deploy(name: string, symbol: string, supply: number) {
    let from = this.accounts[0];
    let contract = new this.web3.eth.Contract(code.abi, null, {
      data: "0x" + code.bytecode,
    });
    console.log(this.accounts[0]);

    const gasPrice = await web3.eth.getGasPrice();
    //Estimate gas to deploy
    const gas = await contract
      .deploy({
        data: `0x${code.bytecode}`,
        arguments: [name, symbol, supply],
      })
      .estimateGas({ from: from });

    return await contract
      .deploy({
        data: `0x${code.bytecode}`,
        arguments: [name, symbol, supply],
      })
      .send({
        from: from,
        gasPrice: gasPrice,
        gas: gas,
      });
  }
}
