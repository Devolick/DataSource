import assert from "assert";
import mockData from "./mockData.json";
import { DataSource, DataSourceOptions, Result } from "../src/index";

interface Mock {
  readonly id: number;
  readonly firtName: string;
  readonly lastName: string;
  readonly email: string;
  readonly carModel: number;
}

describe("Data Source", function () {
  const basicOptions: DataSourceOptions<Mock, string> = {
    limit: 1000,
    size: 50,
    request: ({ search }) => {
      const page = (mockData as unknown as Mock[]).filter(({ firtName }) =>
        firtName.startsWith(search || "")
      );

      return Promise.resolve({
        page,
      });
    },
  };

  describe("clone()", function () {
    it("Clone new data source instance", function () {
      const dataSource = new DataSource({
        limit: 1000,
        size: 50,
        request: () => Promise.resolve({ page: [] }),
      });
      const cloneDataSource = dataSource.clone();

      assert.deepEqual(dataSource, cloneDataSource);
    });
    it("Clone full new data source instance", function () {
      const dataSource = new DataSource({
        limit: 1000,
        size: 50,
        request: () => Promise.resolve({ page: [] }),
      });
      dataSource["search"] = { test: "test" };
      dataSource["page"] = ["test"] as any;
      dataSource["index"] = 1;
      dataSource["indexes"] = 1;
      dataSource["size"] = 40;
      dataSource["limit"] = 900;
      dataSource["total"] = 1200;
      dataSource["loading"] = true;
      dataSource["more"] = true;

      dataSource["_data"] = ["test"] as any;
      dataSource["_filtered"] = ["test"] as any;
      dataSource["_predicate"] = new Function() as any;
      dataSource["_reject"] = new Function() as any;

      const cloneDataSource = dataSource.clone(true);

      assert.deepEqual(dataSource, cloneDataSource);
    });
  });

  describe("query()", function () {
    it("Query data without search", async function () {
      const page = Array(50)
        .fill(0)
        .map((m, i) => i);
      const dataSource = new DataSource({
        limit: 1000,
        size: 50,
        request: () => Promise.resolve({ page }),
      });

      const result = await dataSource.query();
      const answer: Result = {
        page: Array(50)
          .fill(0)
          .map((m, i) => i),
      };

      assert.deepEqual(result, answer);
    });
    it("Query data with search", async function () {
      const dataSource = new DataSource(basicOptions);

      const result = await dataSource.query("Sy");
      const answer: Result = {
        page: [
          {
            id: 8,
            firtName: "Sydney",
            lastName: "Brosnan",
            email: "sbrosnan7@slate.com",
            carModel: "Jetta III",
          },
          {
            id: 790,
            firtName: "Sydney",
            lastName: "Archanbault",
            email: "sarchanbaultlx@1und1.de",
            carModel: "Silverado 3500",
          },
        ],
      };

      assert.deepEqual(result, answer);
    });
  });

  describe("fetch()", function () {
    it("Fetch data without search", async function () {
      let index = -1;
      const dataSource = new DataSource({
        limit: 1000,
        size: 50,
        request: () => {
          if (++index > 2) {
            return Promise.resolve({ page: [] });
          }
          return Promise.resolve({
            page: Array(1000)
              .fill(0)
              .map((m, i) => i + 1000 * index),
          });
        },
      });

      const result = await dataSource.fetch();
      const answer: Result = {
        page: Array(50)
          .fill(0)
          .map((m, i) => i),
        search: undefined,
        total: undefined,
      };

      assert.deepEqual(result, answer);
    });
  });

  describe("next()", function () {
    it("Next data without index", async function () {
      const page = Array(50)
        .fill(0)
        .map((m, i) => i);
      const dataSource = new DataSource({
        limit: 1000,
        size: 50,
        request: () => Promise.resolve({ page }),
      });

      const result = await dataSource.next();
      const answer: Result = {
        page: Array(50)
          .fill(0)
          .map((m, i) => i),
      };

      assert.deepEqual(result, answer);
    });
  });

  describe("cancel()", function () {
    it("Cancel request", function () {
      const dataSource = new DataSource({
        limit: 1000,
        size: 50,
        request: () => Promise.resolve({ page: [] }),
      });

      assert.doesNotThrow(() => {
        dataSource.cancel();
      });
    });
  });

  describe("filter()", function () {
    it("Filter without data", function () {
      const dataSource = new DataSource({
        limit: 1000,
        size: 50,
        request: () => Promise.resolve({ page: [] }),
      });

      const result = dataSource.filter(() => true);
      const answer: Result = {
        page: [],
        search: undefined,
        total: undefined,
      };

      assert.deepEqual(result, answer);
    });
  });

  describe("upsert()", function () {
    it("Upsert without data", function () {
      const dataSource = new DataSource<any>({
        limit: 1000,
        size: 50,
        request: () => Promise.resolve({ page: [] }),
      });

      assert.doesNotThrow(() => {
        dataSource.upsert((value, index) => true, {});
      });
    });
  });

  describe("clear()", function () {
    it("Clear without data", function () {
      const dataSource = new DataSource<any>({
        limit: 1000,
        size: 50,
        request: () => Promise.resolve({ page: [] }),
      });

      assert.doesNotThrow(() => {
        dataSource.clear();
      });
    });
  });

  describe("get()", function () {
    it("Get without data", function () {
      const dataSource = new DataSource<any>({
        limit: 1000,
        size: 50,
        request: () => Promise.resolve({ page: [] }),
      });

      const result = dataSource.get();

      assert.deepEqual(result, []);
    });
  });

  describe("iterator()", function () {
    it("Each without data", function () {
      const dataSource = new DataSource<any>({
        limit: 1000,
        size: 50,
        request: () => Promise.resolve({ page: [] }),
      });

      assert.doesNotThrow(() => {
        for (const item of dataSource) {
        }
      });
    });
  });
});
