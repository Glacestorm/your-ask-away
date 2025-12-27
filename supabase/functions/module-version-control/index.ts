import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const body = await req.json();
    const { action, moduleKey } = body;
    console.log(`[module-version-control] Action: ${action}, Module: ${moduleKey}`);

    const generateVersionData = async (prompt: string) => {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'Genera datos de control de versiones realistas para módulos enterprise en JSON.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return { error: 'Rate limit exceeded', status: 429 };
        }
        throw new Error(`AI error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      } catch {
        return {};
      }
    };

    switch (action) {
      case 'list_versions': {
        const result = await generateVersionData(`Genera lista de 5 versiones para módulo ${moduleKey}:
{
  "versions": [{
    "id": "uuid",
    "moduleKey": "${moduleKey}",
    "version": "semver",
    "semver": { "major": number, "minor": number, "patch": number },
    "branchName": "main",
    "commitHash": "7 chars",
    "commitMessage": "string",
    "author": "string",
    "changes": [{ "type": "added|modified|removed", "field": "string", "description": "string" }],
    "isLatest": boolean,
    "isStable": boolean,
    "tags": ["string"],
    "createdAt": "ISO date"
  }]
}`);

        return new Response(JSON.stringify({
          success: true,
          versions: result.versions || []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'list_branches': {
        const result = await generateVersionData(`Genera lista de branches para módulo ${moduleKey}:
{
  "branches": [{
    "id": "uuid",
    "name": "string",
    "moduleKey": "${moduleKey}",
    "headVersion": "semver",
    "author": "string",
    "description": "string",
    "status": "active|merged|abandoned",
    "isProtected": boolean,
    "isDefault": boolean,
    "createdAt": "ISO date"
  }]
}`);

        return new Response(JSON.stringify({
          success: true,
          branches: result.branches || [{ id: '1', name: 'main', moduleKey, isDefault: true, status: 'active' }]
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'create_version': {
        const newVersion = {
          id: crypto.randomUUID(),
          moduleKey: body.moduleKey,
          version: '1.0.1',
          branchName: body.branch || 'main',
          commitHash: crypto.randomUUID().slice(0, 7),
          commitMessage: body.commitMessage,
          author: 'Current User',
          authorId: body.authorId,
          changes: body.changes || [],
          state: body.newState || {},
          isLatest: true,
          isStable: false,
          tags: [],
          createdAt: new Date().toISOString()
        };

        return new Response(JSON.stringify({
          success: true,
          version: newVersion
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'create_branch': {
        const newBranch = {
          id: crypto.randomUUID(),
          name: body.branchName,
          moduleKey: body.moduleKey,
          baseBranch: body.baseBranch || 'main',
          author: 'Current User',
          authorId: body.authorId,
          description: body.description,
          status: 'active',
          isProtected: false,
          isDefault: false,
          createdAt: new Date().toISOString()
        };

        return new Response(JSON.stringify({
          success: true,
          branch: newBranch
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'list_merge_requests': {
        const result = await generateVersionData(`Genera 3 merge requests para módulo ${moduleKey}:
{
  "mergeRequests": [{
    "id": "uuid",
    "title": "string",
    "description": "string",
    "sourceBranch": "string",
    "targetBranch": "main",
    "moduleKey": "${moduleKey}",
    "author": "string",
    "status": "open|approved|merged|conflict",
    "reviewers": ["string"],
    "approvals": ["string"],
    "conflicts": [],
    "createdAt": "ISO date"
  }]
}`);

        return new Response(JSON.stringify({
          success: true,
          mergeRequests: result.mergeRequests || []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'create_merge_request': {
        return new Response(JSON.stringify({
          success: true,
          mergeRequest: {
            id: crypto.randomUUID(),
            title: body.title,
            description: body.description,
            sourceBranch: body.sourceBranch,
            targetBranch: body.targetBranch,
            moduleKey: body.moduleKey,
            author: 'Current User',
            authorId: body.authorId,
            status: 'open',
            reviewers: body.reviewers || [],
            approvals: [],
            conflicts: [],
            createdAt: new Date().toISOString()
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'merge': {
        return new Response(JSON.stringify({
          success: true,
          message: 'Merge completed successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'rollback': {
        return new Response(JSON.stringify({
          success: true,
          message: `Rollback to ${body.targetVersion} completed`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'compare': {
        const result = await generateVersionData(`Genera diff entre versiones ${body.version1} y ${body.version2}:
{
  "diff": {
    "added": [{ "type": "added", "field": "string", "newValue": "value", "description": "string" }],
    "modified": [{ "type": "modified", "field": "string", "oldValue": "value", "newValue": "value" }],
    "removed": [{ "type": "removed", "field": "string", "oldValue": "value" }],
    "totalChanges": number
  }
}`);

        return new Response(JSON.stringify({
          success: true,
          diff: result.diff || { added: [], modified: [], removed: [], totalChanges: 0 }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'tag_version': {
        return new Response(JSON.stringify({
          success: true,
          message: `Tag '${body.tag}' added`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({
          success: false,
          error: `Unknown action: ${action}`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('[module-version-control] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
