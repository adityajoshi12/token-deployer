import { Component } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { Web3Service } from "./util/web3.service";
@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {
  title = "ERC20 Token";
  transactionHash: string;
  contractAddress: string;
  constructor(private webService: Web3Service, private fb: FormBuilder) {}

  form = this.fb.group({
    name: ["", Validators.required],
    symbol: ["", Validators.required],
    supply: [null, Validators.required],
  });

  deploy(): void {
    this.webService
      .deploy(
        this.form.value.name,
        this.form.value.symbol,
        this.form.value.supply
      )
      .then((transaction) => {
        this.contractAddress = transaction.options.address;
        console.log(transaction);
        this.transactionHash = transaction;
      });
  }
}
