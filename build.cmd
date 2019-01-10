@echo off
rem set registry and version
set DOCKER_REGISTRY=cloud.canister.io:5000/davenemeth/ambassador-extauth-sample
set VERSION=1.0.0

echo using regitry: %DOCKER_REGISTRY%
echo version: %VERSION%

rem login to container registry
rem docker login cloud.canister.io

rem build image
echo Starting to build docker image...
docker build -t %DOCKER_REGISTRY%:%VERSION% .

rem push image
echo Pushing image...
docker push %DOCKER_REGISTRY%:%VERSION%

