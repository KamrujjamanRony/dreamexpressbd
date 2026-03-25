import { Component } from '@angular/core';
import { Navbar } from '../../components/shared/navbar/navbar';
import { RouterOutlet } from '@angular/router';
import { Footer } from "../../components/shared/footer/footer";

@Component({
  selector: 'app-main',
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {

}
