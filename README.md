# Mesa

[![Join the chat at https://gitter.im/mcneely/mesa](https://badges.gitter.im/mcneely/mesa.svg)](https://gitter.im/mcneely/mesa?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
Mesa is a lightweight development framework for AWS Lambda Applications.

Requirements
------------
To Come

Quick Start
-----------
This assumes you understand the basics of creating a Lambda function.
To start a new projects execute the following command.
```
git clone https://github.com/mcneely/mesa.git --depth=1
```
To begin using Mesa, create a new, or move an existing lambda function
into the `lib/` directory. You can either places its as
```
lib/<Function Name>.js
```
or
```
lib/<Function Name>/index.js
```
Make sure that `<Function Name>` is the exact name you will give the lambda
function in AWS. When uploading the lambda in AWS, make sure that that handler
is set to the default: index.handler

How it works
------------
When you upload and execute the lambda function, the context and event objects
are passed to the index.js in the root folder. This loads the Kernel and extracts
the function name from the context object and uses it to call the function you places
in the `lib/` directory. This allows for multiple lambdas that share the same zip. The
Kernel extends the default context and is passed to your function.

The Kernel currently handles logging, deployment environments, service provider for
dependency injection, non-JSON POST/GET request handling.


Authors and contributors
------------------------
### Current
* [Paul L. McNeely][] (Maintainer, support)
[Paul L. McNeely]: http://paulmcneely.com

Project status
--------------
Mesa is currently maintained by Paul L. McNeely.

License
-------
[MPL-2.0](http://www.opensource.org/licenses/MPL-2.0)