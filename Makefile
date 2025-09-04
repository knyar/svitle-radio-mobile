image:
	docker build -t svitle_mobile_build .

build:  image
	docker run -v `pwd`:/app svitle_mobile_build bash -c 'cd /app && yarn install && cd android && ./gradlew assembleDebug --no-daemon'
