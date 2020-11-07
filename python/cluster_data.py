#!/usr/bin/env python
# coding: utf-8

import numpy as np
import pandas as pd
from sklearn import preprocessing
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

infile = 'Data/education.csv'
outfile = 'Data/education_labeled.csv'
df = pd.read_csv(infile)
columns = df.columns
print(df.head())

x = df.values 
min_max_scaler = preprocessing.MinMaxScaler()
x_scaled = min_max_scaler.fit_transform(x)
df = pd.DataFrame(x_scaled)
df.columns = columns
print(df.head())

# Since the nature of the data is unknown, etermine optimal number of clusters to pass to KMeans 
# using the Silhouette method
# The larger the silhouette score, the better clustering we have
sil = []
kmax = 10

for k in range(2, kmax+1):
    kmeans = KMeans(n_clusters = k).fit(df.values)
    labels = kmeans.labels_
    sil.append(silhouette_score(x, labels, metric = 'euclidean'))

n_clusters = sil.index(max(sil)) + 2 # Because we started with k=2
print(n_clusters)

x = df.values # Get normalized values
k_means = KMeans(n_clusters=n_clusters)
k_means.fit(x)

classified_data = k_means.labels_

# Assign labels from KMeans as class and save
df_processed = df.copy()
df_processed['class'] = pd.Series(classified_data, index=df_processed.index)
df_processed.to_csv(outfile)






