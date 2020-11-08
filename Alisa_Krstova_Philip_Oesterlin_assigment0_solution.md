# Assignment 1
The results are visible [here](https://datavis2.netlify.app/).

## Data Clustering

Data was clustered using KMeans. 
```python
KMeans(n_clusters = k).fit(df.values)
``` 
The euclidean distance between the points and the centroids was calculated for every k between 2 and 10. The k with the smallest distance was chosen.


## Loading Data

The datasets are loaded using the csv method that d3 provides.
```javascript
d3.csv("/datasets/" + file);
```
