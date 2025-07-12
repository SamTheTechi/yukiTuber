# latest the gratest image
FROM oven/bun:latest

# working dir as the name says
WORKDIR /usr/src/app

# dependcies intallation
RUN apt-get update && \
  apt-get install -y python3 python3-pip ffmpeg curl && \
  pip3 install  --break-system-packages yt-dlp

# whole content copy
COPY . .

# setting env for youtube-dlp-exec 
ENV YOUTUBE_DL_PATH=/usr/bin/yt-dlp

# port ko expose
EXPOSE 3000

# run the server
CMD [ "bun", "run", "index.ts" ]


