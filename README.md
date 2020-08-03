# Queripulator

This is a prototype for a “query manipulator” for the [Wikidata Query Service][Help:SPARQL].
It hosts an HTTP server (by default on port 8080) which proxies requests to query.wikidata.org.
When it receives a SPARQL query request, it tries to find a matching *handler*
(the handlers are defined in [lib/defaultQueryHandlerChain.js](lib/defaultQueryHandlerChain.js));
if it finds one, then that handler will take over the request,
otherwise the request is sent unmodified to query.wikidata.org just like all non-query requests.

Installed handlers include:

* Serving simple “get item by value” queries via [WikibaseCirrusSearch][],
  completely skipping the query service.
* Detecting queries that only use truthy triples,
  with the intention that they could be sent to a separate query service,
  which would only contain truthy data.
  (However, as no such service exists yet,
  the query is still actually sent to query.wikidata.org.)
* Removing the label service from the query,
  and instead adding labels to the result by getting them from the Wikibase API.
* Optimizing the pattern `FILTER(YEAR(?var) = 1234)` to a more efficient form
  (and then sending the optimized query to query.wikidata.org).
* Answering the query using [Linked Data Fragments][LDF].

## Usage

```sh
git clone https://github.com/wmde/queripulator.git
cd queripulator
npm install
npm run start
```

The server will automatically restart when you make any changes to the source code.

To run the tests, use the standard npm “test” script: `npm run test` or `npm t` in short.

## Bulk-matching queries

The `bulkMatch.js` script can be used to evaluate the Queripulator against a batch of queries,
checking how often each handler matches.
Its input is a CSV file in the following format:

```csv
count,avgquerytime,urlencodedquery
10,10.5,ASK+%7B+%3Fs+%3Fp+%3Fo.+%7D
...
```

The first field is how often the query was run,
the second field how long it took on average (in milliseconds),
and the third field is the query, URL-encoded.
(If you don’t know the first two fields, you can specify 1 and 0.0, but they must be present.)
Assuming the queries are in a file called `data.csv`,
running `node bulkMatch.js data.csv` will parse each query,
find the right handler,
and print an aggregate summary at the end.

```
$ node bulkMatch.js data.csv 
{
  default: { distinct: 1, count: 10, time: 105 },
  total: { distinct: 1, count: 10, time: 105 }
}
```

(In this case, there was only one query,
and none of the handlers matched it so it fell back to the default.)

[Help:SPARQL]: https://www.wikidata.org/wiki/Special:MyLanguage/Wikidata:SPARQL_query_service/Wikidata_Query_Help
[WikibaseCirrusSearch]: https://www.mediawiki.org/wiki/Special:MyLanguage/Help:WikibaseCirrusSearch
[LDF]: https://query.wikidata.org/bigdata/ldf
