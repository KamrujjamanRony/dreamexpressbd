import { Component } from '@angular/core';
import { Navbar } from '../../components/shared/navbar/navbar';
import { RouterOutlet } from '@angular/router';
import { Footer } from "../../components/shared/footer/footer";
import { BottomNav } from '../../components/shared/bottom-nav/bottom-nav';
import { Breadcrumb } from '../../utils/breadcrumb/breadcrumb';

@Component({
  selector: 'app-main',
  imports: [RouterOutlet, Navbar, Footer, BottomNav, Breadcrumb],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {

}
