import { QdrantClient } from "@qdrant/js-client-rest";
import { nanoid } from "nanoid";

// TO connect to Qdrant running locally
const client = new QdrantClient({ url: "http://127.0.0.1:6333" });

const run = async () => {
  const collectionName = `ragdev-${nanoid()}`;

  await client.createCollection(collectionName, {
    vectors: {
      size: 4,
      distance: "Cosine",
    },
    optimizers_config: {
      default_segment_number: 2,
    },
    replication_factor: 2,
  });

  await client.createPayloadIndex(collectionName, {
    field_name: "city",
    field_schema: "keyword",
    wait: true,
  });

  await client.createPayloadIndex(collectionName, {
    field_name: "count",
    field_schema: "integer",
    wait: true,
  });

  await client.createPayloadIndex(collectionName, {
    field_name: "coords",
    field_schema: "geo",
    wait: true,
  });

  await client.upsert(collectionName, {
    wait: true,
    points: [
      // vectors
      {
        id: 1,
        vector: [0.05, 0.61, 0.76, 0.74], // embedding: (files) -> vectors LLM,
        payload: {
          city: "Berlin",
          country: "Germany",
          count: 1000000,
          square: 12.5,
          coords: { lat: 1.0, lon: 2.0 },
        },
      },
      {
        id: 2,
        vector: [0.19, 0.81, 0.75, 0.11],
        payload: { city: ["Berlin", "London"] },
      },
      {
        id: 3,
        vector: [0.36, 0.55, 0.47, 0.94],
        payload: { city: ["Berlin", "Moscow"] },
      },
      {
        id: 4,
        vector: [0.18, 0.01, 0.85, 0.8],
        payload: { city: ["London", "Moscow"] },
      },
      {
        id: "98a9a4b1-4ef2-46fb-8315-a97d874fe1d7",
        vector: [0.24, 0.18, 0.22, 0.44],
        payload: { count: [0] },
      },
      {
        id: "f0e09527-b096-42a8-94e9-ea94d342b925",
        vector: [0.35, 0.08, 0.11, 0.44],
      },
    ],
  });

  const collectionInfo = await client.getCollection(collectionName);
  console.log("number of points:", collectionInfo.points_count);

  const points = await client.retrieve(collectionName, {
    ids: [1, 2],
  });

  console.log("points: ", points);

  const queryVector = [0.2, 0.1, 0.9, 0.7];

  const res1 = await client.search(collectionName, {
    vector: queryVector,
    limit: 3,
  });

  console.log("search result: ", res1);

  const res2 = await client.search(collectionName, {
    vector: queryVector, // user query
    limit: 3,
    filter: {
      must: [
        {
          key: "city",
          match: {
            value: "Berlin",
          },
        },
      ],
    },
  });

  console.log("search result with filter: ", res2);

  // const result = await client.getCollections();
  // console.log("List of collections:", result.collections);
};

run();
