import assert from "assert";
import { DataSource, Result } from "../src/index";

describe("Data Source", function () {
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
      const data = Array(1000)
        .fill(0)
        .map((m, i) => i);
      const dataSource = new DataSource({
        limit: 1000,
        size: 50,
        request: () => Promise.resolve({ page: [] }),
      });

      const result = await dataSource.query();
      const answer: Result = {
        page: Array(50)
          .fill(0)
          .map((m, i) => i),
        search: undefined,
        total: null,
      };
      assert.deepEqual(result, answer);
    });
  });
});
