# latest the gratest image
FROM python:3.13.3-slim

# dependcies intallation
RUN apt-get update && \
  apt-get install -y ffmpeg curl unzip && \
  curl -fsSL https://bun.com/install | bash -s "bun-v1.2.14" && \
  ln -s /root/.bun/bin/bun /usr/local/bin/bun && \
  pip install --break-system-packages yt-dlp

# working dir as the name says
WORKDIR /server

# whole content copy
COPY ./apps/backend/ .

RUN bun install && bun build index.ts --outdir dist --target bun
# setting env for youtube-dlp-exec 
ENV YOUTUBE_DL_PATH=/usr/bin/yt-dlp

# port ko expose
EXPOSE 3000

# run the server
CMD [ "bun", "run", "dist/index.js" ]
