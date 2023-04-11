import assert from "assert";
import _mockData from "./mockData.json";
import { DataSource, DataSourceOptions, Result } from "../src/index";

const mockData = _mockData as unknown as Mock[];

interface Mock {
  readonly id: number;
  readonly firtName: string;
  readonly lastName: string;
  readonly email: string;
  readonly carModel: number;
}

describe("Data Source", function () {
  const basicOptions: DataSourceOptions<Mock, string> = {
    limit: 100,
    size: 50,
    request: ({ search, index, size }) => {
      const page = mockData
        .filter(({ firtName }) => !search || firtName.startsWith(search || ""))
        .slice(index * size, index * size + size);

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ page });
        }, 10);
      });
    },
  };

  describe("clone()", function () {
    it("Clone new data source instance", function () {
      const dataSource = new DataSource(basicOptions);
      const cloneDataSource = dataSource.clone();

      assert.deepEqual(dataSource, cloneDataSource);
    });
    it("Clone full new data source instance", function () {
      const dataSource = new DataSource(basicOptions);
      dataSource["_search"] = { test: "test" } as any;
      dataSource["_page"] = ["test"] as any;
      dataSource["_index"] = 1;
      dataSource["_indexes"] = 1;
      dataSource["_size"] = 40;
      dataSource["_limit"] = 900;
      dataSource["_total"] = 1200;
      dataSource["_loading"] = true;
      dataSource["_more"] = true;

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
      const page = mockData.slice(0, 50);
      const dataSource = new DataSource(basicOptions);

      const result = await dataSource.query();
      const answer: Result = {
        page,

        search: undefined,
        total: undefined,
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
        search: undefined,
        total: undefined,
      };

      assert.deepEqual(result, answer);
    });
  });

  describe("fetch()", function () {
    it("Fetch data without search", async function () {
      const page = mockData.slice(0, 50);
      const dataSource = new DataSource(basicOptions);

      const result = await dataSource.fetch();
      const answer: Result = {
        page,
        search: undefined,
        total: undefined,
      };

      assert.deepEqual(result, answer);
    });
    it("Fetch data with search", async function () {
      const dataSource = new DataSource(basicOptions);

      const result = await dataSource.fetch("Sy");
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

        search: undefined,
        total: undefined,
      };

      assert.deepEqual(result, answer);
    });
  });

  describe("next()", function () {
    it("Next data without index", async function () {
      const page = mockData.slice(0, 50);
      const dataSource = new DataSource(basicOptions);

      const result = await dataSource.next();
      const answer: Result = {
        page,

        search: undefined,
        total: undefined,
      };

      assert.deepEqual(result, answer);
    });
    it("Next data with index", async function () {
      const page = mockData
        .filter(({ firtName }) => firtName.startsWith("A"))
        .slice(0, 50);
      const dataSource = new DataSource(basicOptions);

      await dataSource.fetch("A");
      const result = await dataSource.next();
      const answer: Result = {
        page,

        search: undefined,
        total: undefined,
      };

      assert.deepEqual(result, answer);
    });
  });

  describe("cancel()", function () {
    it("Cancel fetch request", function () {
      const dataSource = new DataSource(basicOptions);

      dataSource.fetch();

      assert.doesNotThrow(() => {
        dataSource.cancel();
      });
    });
    it("Cancel fetch request check state", function () {
      const dataSource = new DataSource(basicOptions);

      dataSource.fetch();
      dataSource.cancel();

      const result: Result = {
        page: dataSource.page,
        search: dataSource.search,
        total: dataSource.total,
      };
      const answer: Result = {
        page: [],

        search: undefined,
        total: undefined,
      };

      assert.deepEqual(result, answer);
    });
    it("Cancel query request", function () {
      const dataSource = new DataSource(basicOptions);

      dataSource.query();

      assert.doesNotThrow(() => {
        dataSource.cancel();
      });
    });
    it("Cancel query request check state", function () {
      const dataSource = new DataSource(basicOptions);

      dataSource.query();
      dataSource.cancel();

      const result: Result = {
        page: dataSource.page,
        search: dataSource.search,
        total: dataSource.total,
      };
      const answer: Result = {
        page: [],

        search: undefined,
        total: undefined,
      };

      assert.deepEqual(result, answer);
    });
    it("Cancel next request", function () {
      const dataSource = new DataSource(basicOptions);

      dataSource.next();

      assert.doesNotThrow(() => {
        dataSource.cancel();
      });
    });
    it("Cancel next request check state", function () {
      const dataSource = new DataSource(basicOptions);

      dataSource.next();
      dataSource.cancel();

      const result: Result = {
        page: dataSource.page,
        search: dataSource.search,
        total: dataSource.total,
      };
      const answer: Result = {
        page: [],

        search: undefined,
        total: undefined,
      };

      assert.deepEqual(result, answer);
    });
  });

  describe("filter()", function () {
    it("Filter without data", function () {
      const dataSource = new DataSource(basicOptions);

      const result = dataSource.filter(() => true);
      const answer: Result = {
        page: [],

        search: undefined,
        total: undefined,
      };

      assert.deepEqual(result, answer);
    });

    it("Filter exist data", async function () {
      const dataSource = new DataSource(basicOptions);

      await dataSource.query();
      const result = dataSource.filter(() => true);
      const answer: Result = {
        page: mockData.slice(0, 50),

        search: undefined,
        total: undefined,
      };

      assert.deepEqual(result, answer);
    });

    it("Filter exist data with value", async function () {
      const dataSource = new DataSource(basicOptions);

      await dataSource.fetch();
      const result = dataSource.filter(({ firtName }) =>
        firtName.startsWith("Sy")
      );
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
        search: undefined,
        total: undefined,
      };

      assert.deepEqual(result, answer);
    });
  });

  describe("upsert()", function () {
    it("Upsert without data", function () {
      const dataSource = new DataSource<Mock>(basicOptions);

      assert.doesNotThrow(() => {
        dataSource.upsert(
          () => true,
          (value) => value
        );
      });
    });

    it("Upsert exist data for value", async function () {
      const dataSource = new DataSource<Mock>(basicOptions);

      await dataSource.fetch();
      const result = dataSource.upsert(
        ({ firtName }) => firtName.startsWith("Sy"),
        (value) => ({ ...value, firtName: "Nadia" })
      );

      const answer: Result = {
        page: mockData.slice(0, 50).map((mock) => {
          if (mock.firtName === "Sydney") {
            return { ...mock, firtName: "Nadia" };
          }

          return mock;
        }),

        search: undefined,
        total: undefined,
      };

      assert.deepEqual(result, answer);
    });
  });

  describe("insert()", function () {});

  describe("remove()", function () {});

  describe("clear()", function () {
    it("Clear without data", function () {
      const dataSource = new DataSource<Mock>(basicOptions);

      assert.doesNotThrow(() => {
        dataSource.clear();
      });
    });
  });

  describe("get()", function () {
    it("Get without data", function () {
      const dataSource = new DataSource<Mock>(basicOptions);

      const result = dataSource.get();

      assert.deepEqual(result, []);
    });
  });

  describe("set()", function () {});

  describe("iterator()", function () {
    it("Each without data", function () {
      const dataSource = new DataSource<Mock>(basicOptions);

      assert.doesNotThrow(() => {
        for (const item of dataSource) {
        }
      });
    });
  });

  describe("Usage", function () {
    it("", function () {});
  });
});
