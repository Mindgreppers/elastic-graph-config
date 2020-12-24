## Setting up ES details

Fill the details in the connection elasticsearch.toml file

## Setting up indices in ES

Once the ES cluster is up. Run the following command from the elasticgraph/lib/mappingGenerator

> DEBUG=* node esMappingGenerator.js ./backend recreate

### To create or recreate a specific index 

> DEBUG=* node esMappingGenerator.js pathToBackendConfig recreate indexName

### To create or recreate specific indices 

> DEBUG=* node esMappingGenerator.js pathToBackendConfig recreate index1,index2

## Deleting indieces

### Deleting specific indices
> DEBUG=* node esMappingGenerator.js pathToBackendConfig delete index1,index2

### Deleting all indices

> DEBUG=* node esMappingGenerator.js pathToBackendConfig delete

## TODO
- Create index joins
- Create union entries, if any