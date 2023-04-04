import { Component } from '@angular/core';
import { DataSource } from 'datasource';
import _mockData from './mockData.json';

const mockData = _mockData as unknown as MockDataItem[];

export interface MockDataItem {
  readonly id: number;
  readonly firtName: string;
  readonly lastName: string;
  readonly email: string;
  readonly carModel: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  displayedColumns: string[] = ['firtName', 'lastName', 'email', 'carModel'];
  dataSource: DataSource<MockDataItem>;

  constructor() {
    this.dataSource = new DataSource<MockDataItem>({
      limit: 100,
      size: 50,
      request: ({ search, index, size }) => {
        const page = mockData
          .filter(
            ({ firtName }) => !search || firtName.startsWith(search || '')
          )
          .slice(index * size, size);

        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ page });
          }, 50);
        });
      },
    });

    this.dataSource.query();
  }
}
