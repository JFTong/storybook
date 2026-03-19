#!/bin/bash

# AI Storybook 功能测试脚本
# 测试所有页面和 API 路由

BASE_URL="http://localhost:3004"
PASS=0
FAIL=0

test_page() {
    local path=$1
    local name=$2
    local expected_code=${3:-200}

    code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$path")

    if [ "$code" = "$expected_code" ] || [ "$code" = "307" ]; then
        echo "✅ $name: HTTP $code"
        ((PASS++))
    else
        echo "❌ $name: HTTP $code (expected $expected_code)"
        ((FAIL++))
    fi
}

test_api() {
    local path=$1
    local name=$2
    local body=$3
    local expected_error=$4

    response=$(curl -s -X POST "$BASE_URL$path" \
        -H "Content-Type: application/json" \
        -d "$body")

    if echo "$response" | grep -q "$expected_error"; then
        echo "✅ $name: 正确返回错误 '$expected_error'"
        ((PASS++))
    else
        echo "❌ $name: 预期错误 '$expected_error', 实际: $response"
        ((FAIL++))
    fi
}

test_content() {
    local path=$1
    local name=$2
    local pattern=$3

    if curl -s "$BASE_URL$path" | grep -q "$pattern"; then
        echo "✅ $name: 包含 '$pattern'"
        ((PASS++))
    else
        echo "❌ $name: 缺少 '$pattern'"
        ((FAIL++))
    fi
}

echo "======================================"
echo "  AI Storybook 功能测试"
echo "======================================"
echo ""

echo "--- 页面加载测试 ---"
test_page "/" "根页面重定向" "307"
test_page "/setup" "Setup 页面" "200"
test_page "/characters" "Characters 页面" "200"
test_page "/story" "Story 页面" "200"
test_page "/generate" "Generate 页面" "200"
test_page "/preview" "Preview 页面" "200"
echo ""

echo "--- API 错误处理测试 ---"
test_api "/api/generate-story" "generate-story" '{}' "API key and theme are required"
test_api "/api/generate-storyboard" "generate-storyboard" '{}' "API key and story content are required"
test_api "/api/generate-image" "generate-image" '{}' "API key and prompt are required"
test_api "/api/generate-character-image" "generate-character-image" '{}' "API key and character data are required"
echo ""

echo "--- 页面内容测试 ---"
test_content "/setup" "Setup 页面" "API Key"
test_content "/setup" "Setup 页面" "Model"
test_content "/setup" "Setup 页面" "Continue to Characters"
test_content "/characters" "Characters 页面" "Add Character"
test_content "/characters" "Characters 页面" "No characters yet"
test_content "/story" "Story 页面" "Story Theme"
test_content "/story" "Story 页面" "Auto-generate"
test_content "/story" "Story 页面" "Storyboards"
test_content "/generate" "Generate 页面" "Start Generation"
test_content "/generate" "Generate 页面" "Generation Progress"
test_content "/preview" "Preview 页面" "Export ZIP"
test_content "/preview" "Preview 页面" "New Book"
echo ""

echo "======================================"
echo "  测试结果: $PASS 通过, $FAIL 失败"
echo "======================================"

if [ $FAIL -eq 0 ]; then
    echo "✅ 所有测试通过!"
    exit 0
else
    echo "❌ 有 $FAIL 个测试失败"
    exit 1
fi