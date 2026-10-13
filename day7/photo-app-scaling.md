# SnapShare Scaling Plan

SnapShare is a photo-sharing app where users upload photos and scroll a feed of photos from people they follow.

## 1. Assumptions

- Registered users: 10,000,000
- 10% are active each day
- Each active user uploads 1 photo per day
- Each active user views 50 feed pages per day
- Average photo size: 2 MB
- Each photo also gets a 50 KB thumbnail
- Peak traffic is 5x the average
- One day has 86,400 seconds

**Daily active users (DAU):** 10,000,000 x 10% = **1,000,000 users per day**

## 2. Estimates

### Uploads per second
- Uploads per day: 1,000,000 x 1 = 1,000,000
- Average: 1,000,000 / 86,400 = about **11.6 uploads/second**
- Peak (5x): about **58 uploads/second**

### Feed views per second
- Feed views per day: 1,000,000 x 50 = 50,000,000
- Average: 50,000,000 / 86,400 = about **579 views/second**
- Peak (5x): about **2,900 views/second**

### Storage per year
- Originals per day: 1,000,000 x 2 MB = 2 TB
- Thumbnails per day: 1,000,000 x 50 KB = 50 GB
- Total per day: about 2.05 TB
- Originals per year: 2 TB x 365 = 730 TB
- Thumbnails per year: 50 GB x 365 = about 18 TB
- **Total per year: about 748 TB (roughly 0.75 PB)**

## 3. Read-heavy or write-heavy?

SnapShare is **read-heavy**. There are 50 million feed views per day against 1 million uploads per day, a ratio of about 50 reads for every write.

What this means for the design:
- Optimise for fast reads: use a CDN, caching and read replicas.
- Writes are fewer, so one primary database can handle them for a long time.
- Uploads are still heavy in data size (2 MB each), so the upload path must not block users. Heavy work like thumbnails is moved to a background job.

## 4. Why photos do not go in the database

Photos should not be stored inside the database because:
- Photo files are large. About 748 TB per year would make the database huge, slow and very expensive to back up and replicate.
- Databases are built for small structured rows, not big binary files.
- Every feed view would pull large files through the database, slowing down all other queries.
- Object storage is much cheaper per GB, scales almost without limit, and works directly with a CDN.

Instead, photos go in **object storage** (such as Amazon S3). The database stores only the metadata (photo id, owner, caption, time) and the **URL/key** of the file in object storage.

## 5. Architecture diagram

```text
                 Users (mobile app / web browser)
                      |                     |
          view photos |                     | upload / feed requests
                      v                     v
                +-----------+        +---------------+
                |    CDN    |        | Load Balancer |
                +-----------+        +---------------+
                      |                     |
                      | cache miss          v
                      |            +---------------------+
                      |            |  App Servers (x N)  |
                      |            +---------------------+
                      |              |      |      |     |
                      |              |      |      |     +------------------+
                      |              v      v      v                        v
                      |        +-------+ +----------+ +-----------+   +---------+
                      |        | Cache | | Database | | Object    |   |  Queue  |
                      |        |       | | (primary)| | Storage   |   |         |
                      |        +-------+ +----------+ +-----------+   +---------+
                      |                       |             ^               |
                      |                       v             |               v
                      |                 +-----------+       |        +-------------+
                      |                 |   Read    |       +--------| Thumbnail   |
                      +---------------->|  Replica  |    saves       | Worker      |
                      (origin = object  +-----------+  thumbnails    +-------------+
                       storage)
```

## 6. What each component does (one sentence each)

- **CDN:** Serves photos and thumbnails from servers close to the user, so images load fast and our servers carry less traffic.
- **Load balancer:** Spreads incoming requests across many app servers so no single server is overloaded and one failure does not take the app down.
- **App servers:** Run the application logic (login, upload, feed) and are stateless, so we can add more of them when traffic grows.
- **Cache:** Keeps frequently requested data, such as popular feeds and photo metadata, in fast memory so the database is hit less often.
- **Database (primary):** Stores users, follows, photo metadata and comments reliably, and handles all the writes.
- **Read replica:** Holds a copy of the database that answers read queries, which takes pressure off the primary since the system is read-heavy.
- **Object storage:** Stores the actual photo and thumbnail files cheaply, durably and at huge scale.
- **Queue:** Holds "make a thumbnail" jobs so the upload request can finish quickly instead of waiting for the slow work.
- **Thumbnail worker:** Takes jobs from the queue, creates the 50 KB thumbnail from the original, and saves it to object storage.

## 7. Upload flow, step by step

1. The user picks a photo in the app and taps upload.
2. The request goes through the **load balancer** to one of the **app servers**.
3. The app server checks that the user is logged in and that the file is a valid image within the size limit.
4. The app server saves the original photo to **object storage** and gets back its key/URL.
5. The app server saves the photo metadata (owner, time, caption, storage key) in the **database**, with status "processing".
6. The app server puts a "create thumbnail" job on the **queue**.
7. The app server immediately tells the user "upload successful", so the user does not wait for the thumbnail.
8. A **thumbnail worker** takes the job from the queue, downloads the original, creates a 50 KB thumbnail, and saves it to object storage.
9. The worker updates the database record to "ready" and the thumbnail URL.
10. Followers' feeds now show the new photo. Feed requests load the thumbnails and photos through the **CDN**, and the **cache** and **read replica** answer the feed queries.
11. If the worker fails, the job stays in the queue and is retried, so no thumbnail is lost.

## 8. Trade-offs

### Trade-off 1: Queue and thumbnail worker (speed vs. immediate consistency)
- **Benefit:** Uploads feel fast, and traffic spikes are absorbed by the queue instead of crashing the servers.
- **Cost:** The thumbnail is not ready the instant the upload finishes. For a few seconds the photo may show a placeholder, and we need extra infrastructure to run and monitor.

### Trade-off 2: Caching and read replicas (speed vs. freshness)
- **Benefit:** Feeds load much faster and the database handles far fewer queries.
- **Cost:** Cached data and replicas can be slightly out of date, so a new photo or a deleted photo may take a moment to show up. Cache invalidation also adds complexity.

### Trade-off 3: Using a CDN (performance vs. cost and control)
- **Benefit:** Photos load quickly worldwide and our servers handle less traffic.
- **Cost:** CDN bandwidth costs money, and deleted or updated photos stay cached until they expire or are purged.

### Trade-off 4: Object storage instead of the database (scale vs. simplicity)
- **Benefit:** Cheap, durable storage that can grow to hundreds of terabytes.
- **Cost:** Photo files and their database records live in two places, so they must be kept in sync. If one save succeeds and the other fails, we need cleanup logic.
